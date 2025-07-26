from django.urls import path
from . import views
from dashboard.views import upload_csv

urlpatterns = [
    path('gerar-plot/', views.gerar_plot_view, name='gerar_plot'),  # type: ignore
    path('upload-csv/', upload_csv, name='upload_csv'),  # type: ignore
]
