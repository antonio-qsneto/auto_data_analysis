# dashboard/api_urls.py
from django.urls import path
from .views.views_auth_status import me

urlpatterns = [
    path("user/me/", me, name="api_user_me"),
]
