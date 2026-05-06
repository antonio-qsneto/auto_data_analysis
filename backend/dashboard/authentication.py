from __future__ import annotations

import logging
from functools import lru_cache

import boto3
import jwt
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


class CognitoJWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth:
            return None

        if auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) != 2:
            raise AuthenticationFailed("Invalid Authorization header.")

        try:
            token = auth[1].decode("utf-8")
        except UnicodeError as exc:
            raise AuthenticationFailed("Invalid Authorization header encoding.") from exc

        payload = self._decode_token(token)
        user = self._sync_local_user(payload, token)
        return user, payload

    def _decode_token(self, token: str) -> dict:
        if not settings.COGNITO_JWKS_URL or not settings.COGNITO_ISSUER:
            raise AuthenticationFailed("Cognito is not configured.")

        try:
            signing_key = _jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=settings.COGNITO_ISSUER,
                options={"verify_aud": False},
            )
        except (InvalidTokenError, PyJWKClientError) as exc:
            raise AuthenticationFailed("Invalid Cognito token.") from exc

        token_use = payload.get("token_use")
        client_id = settings.COGNITO_APP_CLIENT_ID
        if token_use == "access":
            if payload.get("client_id") != client_id:
                raise AuthenticationFailed("Invalid Cognito access token client.")
        elif token_use == "id":
            if payload.get("aud") != client_id:
                raise AuthenticationFailed("Invalid Cognito ID token audience.")
        else:
            raise AuthenticationFailed("Invalid Cognito token use.")

        return payload

    def _sync_local_user(self, payload: dict, token: str):
        User = get_user_model()
        profile = _profile_from_claims(payload)

        if not profile["email"] and payload.get("token_use") == "access":
            profile.update(_profile_from_cognito_access_token(token))

        sub = profile["sub"]
        if not sub:
            raise AuthenticationFailed("Cognito token does not include a subject.")

        email = profile["email"] or f"{sub}@cognito.local"
        username = _username_for_profile(profile, email)

        try:
            with transaction.atomic():
                user = User.objects.filter(cognito_sub=sub).first()
                if not user:
                    user = User.objects.filter(email=email).first()

                if user:
                    if user.cognito_sub and user.cognito_sub != sub:
                        raise AuthenticationFailed("Local user is linked to another Cognito subject.")
                    _update_user_from_profile(user, profile, email, username)
                    user.save()
                    return user

                user = User(
                    username=_unique_username(User, username),
                    email=email,
                    cognito_sub=sub,
                    cognito_username=profile["cognito_username"],
                    first_name=profile["first_name"][:150],
                    profile_picture=profile["picture"][:500],
                )
                user.set_unusable_password()
                user.save()
                return user
        except IntegrityError as exc:
            raise AuthenticationFailed("Could not link Cognito user locally.") from exc


def _profile_from_claims(payload: dict) -> dict:
    full_name = payload.get("name") or ""
    first_name = payload.get("given_name") or full_name or ""

    return {
        "sub": payload.get("sub") or "",
        "cognito_username": payload.get("cognito:username") or payload.get("username") or "",
        "email": payload.get("email") or "",
        "first_name": first_name,
        "picture": payload.get("picture") or "",
    }


def _profile_from_cognito_access_token(token: str) -> dict:
    try:
        response = _cognito_client().get_user(AccessToken=token)
    except (BotoCoreError, ClientError) as exc:
        logger.warning("Could not fetch Cognito user attributes: %s", exc)
        return {}

    attributes = {
        item["Name"]: item["Value"]
        for item in response.get("UserAttributes", [])
        if item.get("Name") and item.get("Value") is not None
    }
    return {
        "cognito_username": response.get("Username") or "",
        "email": attributes.get("email") or "",
        "first_name": attributes.get("given_name") or attributes.get("name") or "",
        "picture": attributes.get("picture") or "",
    }


def _username_for_profile(profile: dict, email: str) -> str:
    raw_username = profile.get("cognito_username") or email.split("@")[0]
    username = str(raw_username).strip() or profile["sub"]
    return username[:150]


def _unique_username(User, username: str) -> str:
    if not User.objects.filter(username=username).exists():
        return username

    base = username[:141].rstrip("_") or "cognito_user"
    suffix = 1
    while True:
        candidate = f"{base}_{suffix}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
        suffix += 1


def _update_user_from_profile(user, profile: dict, email: str, username: str) -> None:
    user.cognito_sub = profile["sub"]
    user.cognito_username = profile["cognito_username"] or user.cognito_username
    if profile["email"] and user.email != email:
        user.email = email
    if profile["first_name"]:
        user.first_name = profile["first_name"][:150]
    if profile["picture"]:
        user.profile_picture = profile["picture"][:500]
    if not user.username:
        user.username = username
    user.set_unusable_password()


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(settings.COGNITO_JWKS_URL)


@lru_cache(maxsize=1)
def _cognito_client():
    return boto3.client("cognito-idp", region_name=settings.COGNITO_REGION)


class LocalJWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        if settings.AUTH_MODE != "local":
            return None

        auth = get_authorization_header(request).split()
        if not auth:
            return None

        if auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) != 2:
            raise AuthenticationFailed("Invalid Authorization header.")

        try:
            token = auth[1].decode("utf-8")
            payload = jwt.decode(
                token,
                settings.LOCAL_AUTH_JWT_SECRET,
                algorithms=["HS256"],
                issuer="auto-data-analysis-local",
                audience="auto-data-analysis-local",
            )
        except (UnicodeError, InvalidTokenError) as exc:
            raise AuthenticationFailed("Invalid local auth token.") from exc

        if payload.get("token_use") != "access":
            raise AuthenticationFailed("Invalid local auth token use.")

        User = get_user_model()
        try:
            user = User.objects.get(id=payload.get("user_id"), is_active=True)
        except User.DoesNotExist as exc:
            raise AuthenticationFailed("Local user not found.") from exc

        return user, payload
