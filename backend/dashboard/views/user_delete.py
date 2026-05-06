# dashboard/views/user_views.py
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class DeleteProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        cognito_username = (
            getattr(user, "cognito_username", None)
            or (request.auth or {}).get("cognito:username")
            or (request.auth or {}).get("username")
            or getattr(user, "cognito_sub", None)
        )

        if settings.COGNITO_USER_POOL_ID and cognito_username:
            client = boto3.client("cognito-idp", region_name=settings.COGNITO_REGION)
            try:
                client.admin_delete_user(
                    UserPoolId=settings.COGNITO_USER_POOL_ID,
                    Username=cognito_username,
                )
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code")
                if code not in {"UserNotFoundException", "ResourceNotFoundException"}:
                    return Response(
                        {"error": "Erro ao deletar usuário no Cognito."},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
            except BotoCoreError:
                return Response(
                    {"error": "Erro ao comunicar com o Cognito."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        user.delete()
        return Response({"detail": "Perfil deletado com sucesso."}, status=status.HTTP_200_OK)
