from django.urls import path
from .views import chart_views
from .views.authentication_view import GoogleLoginView, SignupView
from .views import views_auth_status
from .views.report_views import list_reports, get_report_detail, delete_report
from .views.custom_token_serializer import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView


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

    # Report
    path("reports/", list_reports, name="list_reports"),
    path("reports/<int:pk>/", get_report_detail, name="report_detail"),
    path("reports/<int:pk>/delete/", delete_report, name="report_delete"),

]
