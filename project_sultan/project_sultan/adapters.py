"""
Custom adapters for django-allauth authentication.
Handles post-login redirect with JWT token for Vue frontend.
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter for login redirect with JWT token.
    This handles the redirect URL after ANY login (including social).
    """
    
    def get_login_redirect_url(self, request):
        """
        After successful login (including social), redirect to Vue frontend with JWT.
        """
        user = request.user
        
        if user.is_authenticated:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Redirect to Vue frontend with access token in URL params
            frontend_url = 'http://localhost:5173/'
            params = urlencode({
                'access_token': access_token,
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
