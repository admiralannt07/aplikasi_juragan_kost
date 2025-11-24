from django.contrib import admin
from .models import TipeKamar, Kamar, Penyewa, RiwayatPembayaran

@admin.register(TipeKamar)
class TipeKamarAdmin(admin.ModelAdmin):
    list_display = ('nama_tipe', 'harga_per_bulan')

@admin.register(Kamar)
class KamarAdmin(admin.ModelAdmin):
    list_display = ('nomor_kamar', 'tipe', 'status', 'lantai')
    list_filter = ('status', 'tipe', 'lantai') # Bisa filter status di admin!
    search_fields = ('nomor_kamar',)

@admin.register(Penyewa)
class PenyewaAdmin(admin.ModelAdmin):
    list_display = ('nama_lengkap', 'kamar', 'tanggal_masuk', 'nomor_hp')

@admin.register(RiwayatPembayaran)
class RiwayatPembayaranAdmin(admin.ModelAdmin):
    list_display = ('penyewa', 'jumlah', 'tanggal_bayar')
    list_filter = ('tanggal_bayar',)