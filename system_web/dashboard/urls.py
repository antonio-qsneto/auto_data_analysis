from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('gerar-plot/', views.gerar_plot_view, name='gerar_plot'),  # type: ignore
]
