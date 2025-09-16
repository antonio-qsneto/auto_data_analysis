# dashboard/views/authentication_view.py
import requests
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from ..serializers.user_serializer import UserSerializer
from ..serializers.auth_serializer import SignupSerializer


User = get_user_model()

class GoogleLoginView(APIView):
    authentication_classes = [] 
    permission_classes = []  

    def post(self, request):
        id_token = request.data.get("id_token")
        if not id_token:
            return Response({"error": "Token não enviado"}, status=status.HTTP_400_BAD_REQUEST)

        # Validação do token com Google
        google_resp = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
        )
        payload = google_resp.json()
        print("Google payload:", payload)
        if google_resp.status_code != 200:
            return Response({"error": "Token inválido"}, status=status.HTTP_401_UNAUTHORIZED)

        payload = google_resp.json()
        email = payload.get("email")
        name = payload.get("name")
        picture = payload.get("picture")
        google_id = payload.get("sub")

        if not email:
            return Response({"error": "E-mail não encontrado no token"}, status=status.HTTP_400_BAD_REQUEST)

       
        user, created = User.objects.get_or_create(
            google_id=google_id,
            defaults={
                "username": email,  
                "email": email,
                "first_name": name or "",
                "profile_picture": picture,
            }
        )

        updated = False
        if not user.first_name and name:
            user.first_name = name
            updated = True
        if (not user.profile_picture or user.profile_picture != picture) and picture: # type: ignore
            user.profile_picture = picture # type: ignore
            updated = True
        if updated:
            user.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class SignupView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "id": user.id, # type: ignore
                    "username": user.username, # type: ignore
                    "email": user.email, # type: ignore
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)