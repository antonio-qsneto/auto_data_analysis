from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.permissions import AllowAny, IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from allauth.socialaccount.models import SocialAccount # type: ignore
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile information."""
    user = request.user
    
    # Get social account info if available
    social_account = None
    try:
        social_account = SocialAccount.objects.get(user=user, provider='google')
        extra_data = social_account.extra_data
    except SocialAccount.DoesNotExist:
        extra_data = {}
    
    return Response({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_authenticated': True,
        'google_data': extra_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout the current user."""
    logout(request)
    return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_status(request):
    """Check if user is authenticated."""
    if request.user.is_authenticated:
        return Response({
            'is_authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        })
    else:
        return Response({
            'is_authenticated': False,
            'user': None
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def google_login_url(request):
    """Get Google OAuth login URL."""
    from django.urls import reverse
    from django.conf import settings
    
    # Build the Google OAuth URL
    login_url = request.build_absolute_uri(reverse('google_oauth2_login'))
    
    return Response({
        'login_url': login_url,
        'provider': 'google'
    })

