from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from ..models import PasswordResetToken
from ..serializers.password_reset_serializer import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    User submits email, generates a token, and sends a password reset link.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]  # type: ignore

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Do not reveal if email exists or not
        return Response(
            {"success": "If the email exists, a password reset link will be sent."},
            status=200,
        )

    # Generate token
    reset_token = PasswordResetToken.objects.create(user=user)

    # Build link (frontend URL)
    reset_link = f"{settings.FRONTEND_URL}/reset-password-confirm/{reset_token.token}"

    # Send email
    try:
        send_mail(
            subject="Password Reset - XClarity",
            message=f"Click the link below to reset your password:\n{reset_link}\n\nThe link expires in 1 hour.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
    except Exception as e:
        # Log error (can use logging)
        print(f"Error sending email: {e}")
        return Response(
            {"error": "Unable to send email. Please try again later."},
            status=500,
        )

    return Response(
        {"success": "If the email exists, a password reset link will be sent."},
        status=200,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Receives token + new password, validates, and resets the password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    token = serializer.validated_data["token"]  # type: ignore
    new_password = serializer.validated_data["new_password"]  # type: ignore

    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({"error": "Invalid token"}, status=400)

    if not reset_token.is_valid():
        return Response({"error": "Token expired or already used"}, status=400)

    user = reset_token.user
    user.set_password(new_password)
    user.save()

    reset_token.is_used = True
    reset_token.save()

    return Response({"success": "Password successfully reset!"}, status=200)
