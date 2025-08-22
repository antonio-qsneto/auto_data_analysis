from django.contrib import admin
from django.urls import path, include
from dashboard.views import chart_views

urlpatterns = [
    # Existing chart URLs
    path('gerar_chart/', chart_views.generate_chart_from_csv, name='gerar_chart'),
    path('connect_database/', chart_views.list_database_tables, name='connect_database'),
    path('fetch_table_data/', chart_views.get_table_data, name='fetch_table_data'),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/", include("dashboard.api_urls")),
]
