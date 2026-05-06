from datetime import timedelta

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from jwt.exceptions import InvalidTokenError
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from dashboard.serializers.user_serializer import UserSerializer


def _local_auth_enabled():
    return settings.AUTH_MODE == "local"


def _local_auth_disabled_response():
    return Response(
        {"error": "Local auth is disabled. Set AUTH_MODE=local for development."},
        status=status.HTTP_404_NOT_FOUND,
    )


def _issue_token(user, token_use, lifetime):
    now = timezone.now()
    payload = {
        "iss": "auto-data-analysis-local",
        "aud": "auto-data-analysis-local",
        "iat": int(now.timestamp()),
        "exp": int((now + lifetime).timestamp()),
        "token_use": token_use,
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
    }
    return jwt.encode(payload, settings.LOCAL_AUTH_JWT_SECRET, algorithm="HS256")


def _token_pair_for_user(user):
    access_lifetime = timedelta(minutes=settings.LOCAL_AUTH_ACCESS_MINUTES)
    refresh_lifetime = timedelta(days=settings.LOCAL_AUTH_REFRESH_DAYS)
    return {
        "access": _issue_token(user, "access", access_lifetime),
        "refresh": _issue_token(user, "refresh", refresh_lifetime),
        "expires_in": int(access_lifetime.total_seconds()),
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def local_signup(request):
    if not _local_auth_enabled():
        return _local_auth_disabled_response()

    User = get_user_model()
    email = (request.data.get("email") or "").strip().lower()
    username = (request.data.get("username") or email.split("@")[0]).strip()
    password = request.data.get("password") or ""
    password2 = request.data.get("password2") or ""

    if not email or "@" not in email:
        return Response({"error": "Informe um e-mail válido."}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"error": "A senha deve ter pelo menos 8 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
    if password != password2:
        return Response({"error": "As senhas não coincidem."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Este e-mail já está em uso."}, status=status.HTTP_400_BAD_REQUEST)

    base_username = username[:150] or email.split("@")[0]
    candidate = base_username
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{base_username[:140]}_{suffix}"
        suffix += 1

    user = User.objects.create_user(username=candidate, email=email, password=password)
    tokens = _token_pair_for_user(user)
    return Response(
        {**tokens, "user": UserSerializer(user, context={"request": request}).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def local_login(request):
    if not _local_auth_enabled():
        return _local_auth_disabled_response()

    User = get_user_model()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    user = User.objects.filter(email=email, is_active=True).first()

    if not user or not user.check_password(password):
        return Response({"error": "E-mail ou senha inválidos."}, status=status.HTTP_400_BAD_REQUEST)

    tokens = _token_pair_for_user(user)
    return Response({**tokens, "user": UserSerializer(user, context={"request": request}).data})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def local_refresh(request):
    if not _local_auth_enabled():
        return _local_auth_disabled_response()

    refresh = request.data.get("refresh") or request.data.get("refresh_token") or ""
    try:
        payload = jwt.decode(
            refresh,
            settings.LOCAL_AUTH_JWT_SECRET,
            algorithms=["HS256"],
            issuer="auto-data-analysis-local",
            audience="auto-data-analysis-local",
        )
    except InvalidTokenError:
        return Response({"error": "Refresh token inválido."}, status=status.HTTP_401_UNAUTHORIZED)

    if payload.get("token_use") != "refresh":
        return Response({"error": "Token inválido."}, status=status.HTTP_401_UNAUTHORIZED)

    User = get_user_model()
    user = User.objects.filter(id=payload.get("user_id"), is_active=True).first()
    if not user:
        return Response({"error": "Usuário não encontrado."}, status=status.HTTP_401_UNAUTHORIZED)

    access_lifetime = timedelta(minutes=settings.LOCAL_AUTH_ACCESS_MINUTES)
    return Response(
        {
            "access": _issue_token(user, "access", access_lifetime),
            "refresh": refresh,
            "expires_in": int(access_lifetime.total_seconds()),
        }
    )
