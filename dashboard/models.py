from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings



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