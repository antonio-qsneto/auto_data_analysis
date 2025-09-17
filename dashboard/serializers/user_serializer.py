from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "picture", "quota"]

    def get_picture(self, obj):
        request = self.context.get("request")
        picture = obj.profile_picture

        if not picture:
            return None

        if hasattr(picture, "url"):
            return request.build_absolute_uri(picture.url) if request else picture.url

        return picture

