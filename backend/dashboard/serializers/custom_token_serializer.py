from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD  # This sets the field to 'email'

    def validate(self, attrs):
        # Customize to accept 'email' as input instead of 'username'
        credentials = {
            'email': attrs.get('email'),
            'password': attrs.get('password')
        }

        user = None
        if credentials['email'] and credentials['password']:
            try:
                user = User.objects.get(email=credentials['email'])
                if not user.check_password(credentials['password']):
                    user = None
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError('No active account found with the given credentials') 

        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token), # type: ignore
        }

        return data
