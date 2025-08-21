# dashboard/views_auth_status.py
from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from rest_framework.response import Response  # type: ignore
from allauth.socialaccount.models import SocialAccount  # type: ignore
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    name = (user.get_full_name() or user.first_name or user.username or user.email.split("@")[0])

    # Try to enrich with Google profile data if available
    picture = None
    try:
        sa = SocialAccount.objects.get(user=user, provider="google")
        extra = sa.extra_data or {}
        name = extra.get("name") or extra.get("given_name") or name
        picture = extra.get("picture")
    except SocialAccount.DoesNotExist:
        pass

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": name,
        "picture": picture,
    })
