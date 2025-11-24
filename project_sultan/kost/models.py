# Create your models here.
from django.db import models
from django.utils import timezone
import datetime

# 1. Tabel Kasta (Tipe Kamar) - INDUK (One)
class TipeKamar(models.Model):
    nama_tipe = models.CharField(max_length=100, unique=True)
    harga_per_bulan = models.DecimalField(max_digits=12, decimal_places=0)
    fasilitas = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.nama_tipe} (Rp {self.harga_per_bulan:,})"

# 2. Tabel Aset (Kamar Fisik) - ANAK DARI TIPEKAMAR (Many)
class Kamar(models.Model):
    class StatusKamar(models.TextChoices):
        KOSONG = 'KOSONG', 'Kosong'
        ISI = 'ISI', 'Terisi'
        MAINTENANCE = 'MAINTENANCE', 'Perbaikan'

    nomor_kamar = models.CharField(max_length=10, unique=True)
    # OneToMany: Satu Tipe punya Banyak Kamar
    tipe = models.ForeignKey(TipeKamar, on_delete=models.PROTECT, related_name='kamar_list')
    lantai = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20, 
        choices=StatusKamar.choices, 
        default=StatusKamar.KOSONG
    )

    def __str__(self):
        return f"{self.nomor_kamar} ({self.status})"

# 3. Tabel Cuan (Penyewa) - PASANGAN DARI KAMAR (OneToOne)
class Penyewa(models.Model):
    nama_lengkap = models.CharField(max_length=200)
    nomor_hp = models.CharField(max_length=20, help_text="Nomor WA aktif")
    ktp_foto = models.ImageField(upload_to='ktp_penyewa/', blank=True, null=True)
    
    kamar = models.OneToOneField(Kamar, on_delete=models.SET_NULL, null=True, blank=True, related_name='penyewa')
    
    # --- 2. GANTI BAGIAN INI ---
    # DARI: default=timezone.now
    # JADI: default=datetime.date.today
    tanggal_masuk = models.DateField(default=datetime.date.today)
    
    durasi_sewa_bulan = models.PositiveIntegerField(default=1, help_text="Berapa bulan sewa di awal")

    def __str__(self):
        return self.nama_lengkap

# 4. TABEL BARU: Riwayat Pembayaran (OneToMany)
class RiwayatPembayaran(models.Model):
    # OneToMany: Satu Penyewa punya Banyak Riwayat Bayar
    penyewa = models.ForeignKey(Penyewa, on_delete=models.CASCADE, related_name='riwayat_bayar')
    
    tanggal_bayar = models.DateTimeField(auto_now_add=True)
    jumlah = models.DecimalField(max_digits=12, decimal_places=0)
    keterangan = models.TextField(blank=True, help_text="Contoh: Bayar Kost Maret 2025")
    bukti_transfer = models.ImageField(upload_to='bukti_bayar/', blank=True, null=True)

    def __str__(self):
        return f"{self.penyewa.nama_lengkap} - Rp {self.jumlah:,}"

# --- AUTOMATION MAGIC (SIGNALS) ---
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# 1. Kalo Penyewa Disimpan (Check-In), Ubah Status Kamar jadi ISI
@receiver(post_save, sender=Penyewa)
def update_kamar_isi(sender, instance, created, **kwargs):
    if created and instance.kamar: # Cuma kalo data baru & ada kamarnya
        kamar = instance.kamar
        kamar.status = Kamar.StatusKamar.ISI
        kamar.save()

# 2. Kalo Penyewa Dihapus (Check-Out), Ubah Status Kamar jadi KOSONG
@receiver(post_delete, sender=Penyewa)
def update_kamar_kosong(sender, instance, **kwargs):
    if instance.kamar:
        kamar = instance.kamar
        kamar.status = Kamar.StatusKamar.KOSONG
        kamar.save()