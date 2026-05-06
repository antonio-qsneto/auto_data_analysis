from django.urls import path
from .views import chart_views
from .views import views_auth_status
from .views.report_views import list_reports, get_report_detail, delete_report
from .views.user_delete import DeleteProfileView
from .views.chat_view import chat_api
from .views.health import health_check
from .views import local_auth


urlpatterns = [
    path("health/", health_check, name="health_check"),

    # Chart generation URLs
    path("generate_chart_from_csv/", chart_views.generate_chart_from_csv, name="generate_chart_from_csv"),
    path("generate_chart_from_database/", chart_views.generate_chart_from_database, name="fetch_table_data"),
    path("connect_database/", chart_views.list_database_tables, name="connect_database"),

    # Cognito authenticated user
    path("user/me/", views_auth_status.me, name="me"),
    path("auth/local/signup/", local_auth.local_signup, name="local_signup"),
    path("auth/local/login/", local_auth.local_login, name="local_login"),
    path("auth/local/refresh/", local_auth.local_refresh, name="local_refresh"),

    # Report
    path("reports/", list_reports, name="list_reports"),
    path("reports/<int:pk>/", get_report_detail, name="report_detail"),
    path("reports/<int:pk>/delete/", delete_report, name="report_delete"),

    # Delete profile user
    path("user/delete/", DeleteProfileView.as_view(), name="delete-profile"),

    path("task_status/<str:task_id>/", chart_views.get_task_status, name="task_status"),

    # Chat
    path("chat_with_data/", chat_api, name="chat_with_data"),



]
