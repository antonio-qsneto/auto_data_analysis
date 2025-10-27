from django.urls import path
from .views import chart_views
from .views.authentication_view import GoogleLoginView, SignupView
from .views import views_auth_status
from .views.report_views import list_reports, get_report_detail, delete_report
from .views.user_delete import DeleteProfileView
from .views.custom_token_serializer import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import password_reset_views


urlpatterns = [
    # Chart generation URLs
    path("generate_chart_from_csv/", chart_views.generate_chart_from_csv, name="generate_chart_from_csv"),
    path("generate_chart_from_database/", chart_views.generate_chart_from_database, name="fetch_table_data"),
    path("connect_database/", chart_views.list_database_tables, name="connect_database"),

    # JWT via e-mail/senha
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Login
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),    
    path("auth/signup/", SignupView.as_view(), name="signup"),   
    path("user/me/", views_auth_status.me, name="me"),

    # Report
    path("reports/", list_reports, name="list_reports"),
    path("reports/<int:pk>/", get_report_detail, name="report_detail"),
    path("reports/<int:pk>/delete/", delete_report, name="report_delete"),

    # Password reset
    path("password-reset/request/", password_reset_views.request_password_reset, name="password-reset-request"),
    path("password-reset/confirm/", password_reset_views.confirm_password_reset, name="password-reset-confirm"),

    # Delete profile user
    path("user/delete/", DeleteProfileView.as_view(), name="delete-profile"),

    path("task_status/<str:task_id>/", chart_views.get_task_status, name="task_status"),


]
