# dashboard/api_urls.py
from django.urls import path
from .views.views_auth_status import me
from .views.view_report import upload_report, list_reports

urlpatterns = [
    path("user/me/", me, name="api_user_me"),
    path("reports/upload/", upload_report, name="upload_report"),
    path("reports/", list_reports, name="list_reports"),
]
