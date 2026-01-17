"""
Custom adapters for django-allauth authentication.
Handles post-login redirect with JWT tokens for Vue frontend.

NOTE: For development, both access and refresh tokens are passed via URL params.
In production with same-origin deployment, HttpOnly cookies should be used instead.
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter for login redirect with JWT tokens.
    This handles the redirect URL after ANY login (including social).
    """
    
    def get_login_redirect_url(self, request):
        """
        After successful login (including social), redirect to Vue frontend with JWT tokens.
        Both access and refresh tokens are passed for development mode.
        """
        user = request.user
        
        if user.is_authenticated:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Redirect to Vue frontend with both tokens in URL params
            # NOTE: In production, use HttpOnly cookies instead
            frontend_url = 'http://localhost:5173/'
            params = urlencode({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer'
            })
            
            print(f"[OAuth Redirect] Generated JWT for user {user.username}, redirecting to Vue...")
            
            return f"{frontend_url}?{params}"
        
        return 'http://localhost:5173/login'


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social account settings.
    The login redirect is handled by CustomAccountAdapter.
    """
    pass
