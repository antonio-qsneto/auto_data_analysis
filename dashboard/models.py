from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone
import uuid
from datetime import timedelta


class CustomUser(AbstractUser):
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    email = models.EmailField(unique=True)
    quota = models.PositiveIntegerField(default=10)


class Report(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    s3_key = models.CharField(max_length=255)  # caminho no S3
    s3_url = models.URLField()                # URL pública ou assinada

    def __str__(self):
        return f"Report {self.id} - {self.user.email}" # type: ignore


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)  # type: ignore
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and (timezone.now() - self.created_at) < timedelta(hours=1)

    @classmethod
    def clean_expired_tokens(cls):
        """
        Remove tokens expirados ou já utilizados do banco.
        """
        expired_tokens = cls.objects.filter(
            is_used=True
        ) | cls.objects.filter(
            created_at__lt=timezone.now() - timedelta(hours=1)
        )
        count = expired_tokens.count()
        expired_tokens.delete()
        return count