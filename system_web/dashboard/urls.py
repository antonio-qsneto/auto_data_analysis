from django.urls import path
from dashboard import views

urlpatterns = [
    path('gerar_chart/', views.gerar_chart_view, name='gerar_chart'),
]
