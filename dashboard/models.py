import os
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

    date_str = today.strftime("%d_%m_%Y_%H_%M")
    unique_name = f"{date_str}_data_report.pdf"

    return os.path.join(base_path, unique_name)


class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    name = models.CharField(max_length=255, default='data_report.pdf')
    file = models.FileField(upload_to=report_upload_to)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.name or self.name == 'data_report.pdf':
            self.name = timezone.now().strftime("%d_%m_%Y_%H_%M") + "_data_report.pdf"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} for {self.user.email}"
