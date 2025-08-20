# google_auth_views.py
from django.contrib.auth import login
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.permissions import AllowAny # type: ignore
from rest_framework.response import Response # type: ignore
from google.oauth2 import id_token # type: ignore
from google.auth.transport import requests # type: ignore
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Verify Google JWT sent from React frontend and log in the user.
    """
    import json
    data = json.loads(request.body)
    token = data.get('credential')

    if not token:
        return Response({'success': False, 'error': 'No credential provided'}, status=400)

    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            "REMOVED"  # Your client ID
        )

        email = idinfo.get('email')
        name = idinfo.get('name')

        # Create or get the user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': name}
        )

        # Log in the user
        login(request, user)

        print(email, name)

        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name
            }
        })
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
