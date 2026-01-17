from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import TipeKamar, Kamar, Penyewa, RiwayatPembayaran
from .serializers import (
    TipeKamarSerializer, KamarSerializer, 
    PenyewaSerializer, RiwayatPembayaranSerializer
)


# 1. ViewSet Tipe Kamar (No pagination - usually small dataset)
class TipeKamarViewSet(viewsets.ModelViewSet):
    queryset = TipeKamar.objects.all()
    serializer_class = TipeKamarSerializer
    pagination_class = None  # Disable server pagination, frontend handles it

# 2. ViewSet Kamar (No pagination - frontend handles pagination)
class KamarViewSet(viewsets.ModelViewSet):
    queryset = Kamar.objects.all().order_by('nomor_kamar')
    serializer_class = KamarSerializer
    pagination_class = None  # Disable server pagination, frontend handles it
    
    # Fitur P10: Filtering & Searching
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'lantai', 'tipe'] # Bisa filter: ?status=KOSONG
    search_fields = ['nomor_kamar'] # Bisa cari: ?search=A01

# 3. ViewSet Penyewa (No pagination - frontend handles pagination)
class PenyewaViewSet(viewsets.ModelViewSet):
    queryset = Penyewa.objects.all().order_by('-id')
    serializer_class = PenyewaSerializer
    pagination_class = None  # Disable server pagination, frontend handles it
    
    # TAMBAHIN DjangoFilterBackend DI SINI
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    # KITA BOLEHIN FILTER BERDASARKAN KAMAR
    filterset_fields = ['kamar'] 
    
    search_fields = ['nama_lengkap', 'nomor_hp']

# 4. ViewSet Riwayat Bayar (Keep pagination - can grow large)
class RiwayatPembayaranViewSet(viewsets.ModelViewSet):
    queryset = RiwayatPembayaran.objects.all().order_by('-tanggal_bayar')
    serializer_class = RiwayatPembayaranSerializer
    # Uses default pagination from settings (PAGE_SIZE: 10)
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['penyewa'] # Liat histori bayar si Budi doang

# 5. API Summary Keuangan (Custom View)
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncMonth
import datetime

class FinancialSummaryView(APIView):
    def get(self, request):
        # 1. Total Pendapatan (All Time)
        total_pendapatan = RiwayatPembayaran.objects.aggregate(total=Sum('jumlah'))['total'] or 0
        
        # 2. Pendapatan Bulan Ini
        today = datetime.date.today()
        pendapatan_bulan_ini = RiwayatPembayaran.objects.filter(
            tanggal_bayar__year=today.year,
            tanggal_bayar__month=today.month
        ).aggregate(total=Sum('jumlah'))['total'] or 0
        
        # 3. Data Grafik (Per Bulan - 6 Bulan Terakhir)
        # Group by Month
        grafik_data = RiwayatPembayaran.objects.annotate(
            bulan=TruncMonth('tanggal_bayar')
        ).values('bulan').annotate(
            total=Sum('jumlah')
        ).order_by('bulan')
        
        # Format data grafik biar enak di frontend
        labels = []
        data = []
        for item in grafik_data:
            labels.append(item['bulan'].strftime('%B %Y'))
            data.append(item['total'])
            
        # 4. 5 Transaksi Terakhir
        recent_tx = RiwayatPembayaran.objects.select_related('penyewa').order_by('-tanggal_bayar')[:5]
        recent_data = []
        for tx in recent_tx:
            recent_data.append({
                'penyewa': tx.penyewa.nama_lengkap,
                'jumlah': tx.jumlah,
                'tanggal': tx.tanggal_bayar.strftime('%d %b %Y'),
                'keterangan': tx.keterangan
            })

        return Response({
            'total_pendapatan': total_pendapatan,
            'pendapatan_bulan_ini': pendapatan_bulan_ini,
            'grafik': {
                'labels': labels,
                'data': data
            },
            'recent_transactions': recent_data
        })