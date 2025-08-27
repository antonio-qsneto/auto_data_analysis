from django.urls import path
from .views.views_auth_status import me
from .views.view_report import upload_report, list_reports, delete_report

urlpatterns = [
    path("user/me/", me, name="api_user_me"),
    path("reports/upload/", upload_report, name="upload_report"),
    path("reports/", list_reports, name="list_reports"),
    path("reports/<int:report_id>/delete/", delete_report, name="delete_report"),
]
