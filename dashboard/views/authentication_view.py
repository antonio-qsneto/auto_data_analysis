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

        email = payload.get("email")
        name = payload.get("name")
        picture = payload.get("picture")
        google_id = payload.get("sub")

        if not email:
            return Response({"error": "E-mail não encontrado no token"}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica se já existe usuário com esse e-mail
        user = User.objects.filter(email=email).first()

        if user:
            # Caso já exista um usuário com este e-mail
            if not user.google_id: # type: ignore
                # Associa a conta Google ao usuário existente
                user.google_id = google_id # type: ignore
                if name and not user.first_name:
                    user.first_name = name
                if picture:
                    user.profile_picture = picture # type: ignore
                user.save()
            elif user.google_id != google_id: # type: ignore
                return Response(
                    {"error": "Este e-mail já está vinculado a outra conta Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Se não existe, cria novo usuário
            user = User.objects.create(
                username=email,
                email=email,
                first_name=name or "",
                google_id=google_id,
                profile_picture=picture,
            )

        # Gera os tokens JWT
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
                    "id": user.id,  # type: ignore
                    "username": user.username,  # type: ignore
                    "email": user.email,  # type: ignore
                },
                status=status.HTTP_201_CREATED,
            )

        # Captura mensagens personalizadas
        errors = serializer.errors
        if "email" in errors:
            return Response({"error": errors["email"][0]}, status=status.HTTP_400_BAD_REQUEST) # type: ignore
        if "username" in errors:
            return Response({"error": errors["username"][0]}, status=status.HTTP_400_BAD_REQUEST) # type: ignore
        if "password" in errors:
            return Response({"error": errors["password"][0]}, status=status.HTTP_400_BAD_REQUEST) # type: ignore

        # fallback para erros inesperados
        return Response({"error": "Erro no cadastro."}, status=status.HTTP_400_BAD_REQUEST)

