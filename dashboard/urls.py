from django.urls import path
from .views import chart_views
from .views.authentication_view import GoogleLoginView, SignupView
from .views import views_auth_status
from .views.custom_token_serializer import MyTokenObtainPairView



from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views.view_report import (
    delete_report,
    download_report,
    list_reports,
    upload_report,
)


urlpatterns = [
    # Chart generation URLs
    path("gerar_chart/", chart_views.generate_chart_from_csv, name="gerar_chart"),
    path("connect_database/", chart_views.list_database_tables, name="connect_database"),
    path("fetch_table_data/", chart_views.get_table_data, name="fetch_table_data"),

    # JWT via e-mail/senha
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Login
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),    
    path("auth/signup/", SignupView.as_view(), name="signup"),   
    path("user/me/", views_auth_status.me, name="me"),

    # Report management URLs
    path("reports/", list_reports, name="list_reports"),
    path("reports/upload/", upload_report, name="upload_report"),
    path("reports/<int:report_id>/delete/", delete_report, name="delete_report"),
    path("reports/<int:report_id>/download/", download_report, name="download_report"),
]
