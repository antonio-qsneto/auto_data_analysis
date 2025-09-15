# dashboard/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser  # ajuste se seu modelo estiver em outro lugar

@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    pass
