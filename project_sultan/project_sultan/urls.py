"""
URL configuration for project_sultan project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ============================================================
    # AUTHENTICATION ENDPOINTS (dj-rest-auth + JWT)
    # ============================================================
    # Login/Logout/User (JWT with HttpOnly cookies)
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # Registration (with email verification)
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Social Authentication (Google, Facebook)
    # allauth requires /accounts/ path for OAuth login flow
    path('accounts/', include('allauth.urls')),
    
    # DRF Browsable API login (for development)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    
    # ============================================================
    # API ENDPOINTS
    # ============================================================
    path('api/', include('kost.api_urls')),
    
    # ============================================================
    # DOCUMENTATION (Swagger)
    # ============================================================
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
