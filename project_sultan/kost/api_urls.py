from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipeKamarViewSet, KamarViewSet, 
    PenyewaViewSet, RiwayatPembayaranViewSet,
    FinancialSummaryView
)

router = DefaultRouter()
router.register(r'tipe-kamar', TipeKamarViewSet)
router.register(r'kamar', KamarViewSet)
router.register(r'penyewa', PenyewaViewSet)
router.register(r'riwayat-bayar', RiwayatPembayaranViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('financial-summary/', FinancialSummaryView.as_view(), name='financial-summary'),
]