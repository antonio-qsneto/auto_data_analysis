# models.py
import os
import uuid
from django.utils import timezone
from django.utils.text import get_valid_filename
from django.db import models
from django.contrib.auth.models import User

def report_upload_to(instance, filename):
    filename = get_valid_filename(filename)

    today = timezone.now()
    base_path = os.path.join(
        "reports",
        str(today.year),
        f"{today.month:02d}",
        f"{today.day:02d}",
        str(instance.user.id)
    )

    ts = int(today.timestamp())
    unique_prefix = f"{ts}_{uuid.uuid4().hex}"

    unique_name = f"{unique_prefix}_{filename}"
    return os.path.join(base_path, unique_name)


class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    name = models.CharField(max_length=255, default='report.pdf')
    file = models.FileField(upload_to=report_upload_to)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} for {self.user.email}"
