from django.urls import path
from dashboard.views import chart_views



urlpatterns = [
    path('gerar_chart/', chart_views.gerar_chart_view, name='gerar_chart'),
    path('connect_database/', chart_views.connect_database, name='connect_database'),
    path('fetch_table_data/', chart_views.fetch_table_data, name='fetch_table_data'),
]
