import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auto_data_analysis.settings")

app = Celery("dashboard")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()
