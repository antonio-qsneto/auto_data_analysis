from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..serializers.user_serializer import UserSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user, context={"request": request})
    return Response(serializer.data)
