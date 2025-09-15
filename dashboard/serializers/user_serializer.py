# app/core/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "picture"]

    def get_picture(self, obj):
        request = self.context.get("request")
        picture = obj.profile_picture

        if not picture:
            return None

        # Caso seja um ImageField/FileField
        if hasattr(picture, "url"):
            return request.build_absolute_uri(picture.url) if request else picture.url

        # Caso já seja string (URL externa)
        return picture

