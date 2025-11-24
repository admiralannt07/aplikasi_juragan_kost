from rest_framework import serializers
from .models import TipeKamar, Kamar, Penyewa, RiwayatPembayaran

# 1. Serializer Kasta (Tipe Kamar)
class TipeKamarSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipeKamar
        fields = '__all__'

# 2. Serializer Aset (Kamar) - SMART VERSION
class KamarSerializer(serializers.ModelSerializer):
    # Trik: Ini buat nampilin detail tipe kamar pas GET (Read)
    tipe_detail = TipeKamarSerializer(source='tipe', read_only=True)
    
    class Meta:
        model = Kamar
        fields = ['id', 'nomor_kamar', 'tipe', 'tipe_detail', 'lantai', 'status']
        # 'tipe' buat input ID, 'tipe_detail' buat output JSON lengkap

# 3. Serializer Cuan (Penyewa)
class PenyewaSerializer(serializers.ModelSerializer):
    # Biar pas GET penyewa, kita tau dia di kamar nomor berapa & statusnya apa
    kamar_detail = KamarSerializer(source='kamar', read_only=True)

    class Meta:
        model = Penyewa
        fields = ['id', 'nama_lengkap', 'nomor_hp', 'ktp_foto', 'kamar', 'kamar_detail', 'tanggal_masuk', 'durasi_sewa_bulan']

# 4. Serializer Riwayat Bayar
class RiwayatPembayaranSerializer(serializers.ModelSerializer):
    penyewa_nama = serializers.CharField(source='penyewa.nama_lengkap', read_only=True)

    class Meta:
        model = RiwayatPembayaran
        fields = ['id', 'penyewa', 'penyewa_nama', 'tanggal_bayar', 'jumlah', 'keterangan', 'bukti_transfer']