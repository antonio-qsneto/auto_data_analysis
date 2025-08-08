from django.urls import path
from dashboard.views import chart_views

urlpatterns = [
    path('gerar_chart/', chart_views.gerar_chart_view, name='gerar_chart'),
]
