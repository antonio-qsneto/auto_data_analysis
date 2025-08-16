from django.urls import path
from dashboard.views import chart_views



urlpatterns = [
    path('gerar_chart/', chart_views.generate_chart_from_csv, name='gerar_chart'),
    path('connect_database/', chart_views.list_database_tables, name='connect_database'),
    path('fetch_table_data/', chart_views.get_table_data, name='fetch_table_data'),
]
