from django.urls import path
from dashboard.views import chart_views
from dashboard import auth_views, google_auth_views

urlpatterns = [
    # Existing chart URLs
    path('gerar_chart/', chart_views.generate_chart_from_csv, name='gerar_chart'),
    path('connect_database/', chart_views.list_database_tables, name='connect_database'),
    path('fetch_table_data/', chart_views.get_table_data, name='fetch_table_data'),
    
    # Authentication URLs
    path('api/auth/user/', auth_views.user_profile, name='user_profile'),
    path('api/auth/logout/', auth_views.logout_user, name='logout_user'),
    path('api/auth/status/', auth_views.auth_status, name='auth_status'),
    path('api/auth/google-login-url/', auth_views.google_login_url, name='google_login_url'),
    path('api/auth/google/', google_auth_views.google_login, name='google_login'),
]
