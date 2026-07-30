# 📹 SKRIP VIDEO PRESENTASI PROYEK
## SULTAN - Sistem Unggulan Tata Kelola Hunian (Aplikasi Juragan Kost)

---

## 📋 OVERVIEW STRUKTUR VIDEO

| No | Bagian | Durasi Estimasi | Konten |
|----|--------|-----------------|--------|
| 1 | Opening & Intro Project | 2-3 menit | Pengenalan diri & deskripsi project |
| 2 | Penjelasan Arsitektur | 3-5 menit | Decoupled architecture & tech stack |
| 3 | Demo Aplikasi | 5-8 menit | Walkthrough fitur-fitur utama |
| 4 | Breakdown Koding | 8-10 menit | Struktur backend, modul, & implementasi |
| 5 | Closing | 1 menit | Kesimpulan & call-to-action |

**Total Estimasi: 19-27 menit**

---

# 🎬 BAGIAN 1: OPENING & PENJELASAN SINGKAT PROJECT
**[00:00 - 03:00]**

## 🎤 SKRIP NARASI:

> **[TAMPILAN: Slide judul dengan logo SULTAN]**

---

### A. OPENING (30 detik)

```
"Assalamualaikum warahmatullahi wabarakatuh, selamat [pagi/siang/sore] semuanya.

Perkenalkan, saya [NAMA ANDA], dan hari ini saya akan mempresentasikan proyek 
saya yang berjudul 'SULTAN' — singkatan dari Sistem Unggulan Tata Kelola 
Hunian. Ini adalah aplikasi manajemen kost yang dibangun dengan arsitektur 
decoupled modern menggunakan Django REST Framework sebagai backend dan 
Vue.js sebagai frontend."
```

---

### B. DESKRIPSI PROJECT (1 menit)

> **[TAMPILAN: Slide overview dengan icon-icon fitur]**

```
"Jadi, apa itu SULTAN?

SULTAN adalah aplikasi manajemen kost yang dirancang khusus untuk membantu 
pemilik kost — atau yang biasa kita sebut 'juragan' — dalam mengelola properti 
mereka secara digital.

Mengapa aplikasi ini penting? Karena saat ini banyak pemilik kost yang masih 
menggunakan cara manual — pencatatan di buku tulis, mengingatkan pembayaran 
lewat chat, dan tidak ada laporan keuangan yang terstruktur. SULTAN hadir 
untuk menjawab masalah-masalah tersebut."
```

---

### C. FITUR UTAMA (1 menit)

> **[TAMPILAN: Infografis 4 fitur utama]**

```
"Ada 4 fitur utama dalam aplikasi SULTAN:

1. MANAJEMEN KAMAR
   - Juragan bisa menambahkan, mengedit, dan menghapus data kamar.
   - Setiap kamar memiliki tipe, lantai, dan status — apakah kosong, terisi, 
     atau dalam perbaikan.
   - Yang menarik, status kamar akan OTOMATIS berubah saat ada penyewa 
     melakukan check-in atau check-out.

2. MANAJEMEN PENYEWA
   - Mencatat data penyewa lengkap: nama, nomor HP, foto KTP.
   - Tracking tanggal masuk dan durasi sewa.
   - Relasi one-to-one dengan kamar — satu kamar hanya bisa ditempati 
     satu penyewa.

3. LAPORAN KEUANGAN
   - Mencatat setiap pembayaran dari penyewa.
   - Visualisasi pendapatan bulanan dengan grafik Chart.js.
   - Summary cards: pendapatan bulan ini vs total pendapatan all-time.

4. DASHBOARD INTERAKTIF
   - Overview statistik real-time: total kamar, terisi, dan kosong.
   - Filter dinamis untuk menampilkan kamar berdasarkan status.
   - Antarmuka modern dengan animasi yang smooth."
```

---

### D. ALASAN PEMILIHAN ARSITEKTUR DECOUPLED (1 menit)

> **[TAMPILAN: Diagram arsitektur Frontend ↔ API ↔ Backend]**

```
"Sekarang, pertanyaan penting: MENGAPA saya memilih arsitektur DECOUPLED 
atau yang sering disebut juga sebagai microservice-style architecture?

Ada 3 alasan utama:

1. SEPARATION OF CONCERNS
   Backend Django hanya fokus pada business logic dan database.
   Frontend Vue.js fokus pada user interface dan user experience.
   Keduanya berkomunikasi melalui RESTful API dengan format JSON.

2. SCALABILITY & FLEXIBILITY
   Dengan arsitektur ini, backend dan frontend bisa di-deploy secara 
   terpisah. Misalnya, backend di server Django dengan Gunicorn, 
   sementara frontend bisa di-deploy di CDN seperti Vercel atau Netlify.
   
   Ke depannya, kalau ingin membuat aplikasi mobile, kita cukup 
   menggunakan API yang sama — tidak perlu rebuild backend.

3. TEAM COLLABORATION
   Dalam tim yang besar, backend developer dan frontend developer 
   bisa bekerja paralel tanpa saling mengganggu. API contract menjadi 
   'kontrak' yang menyatukan keduanya."
```

---

# 🎬 BAGIAN 2: PENJELASAN ARSITEKTUR & TECH STACK
**[03:00 - 08:00]**

## 🎤 SKRIP NARASI:

> **[TAMPILAN: Diagram Tech Stack]**

---

### A. TECH STACK BACKEND (1.5 menit)

```
"Mari kita bahas tech stack yang saya gunakan, dimulai dari BACKEND.

FRAMEWORK: Django 5.2.8
- Django adalah web framework Python yang powerful dan mature.
- Saya menggunakan versi terbaru untuk mendapatkan fitur-fitur modern.

API LAYER: Django REST Framework (DRF) 3.16.1
- DRF adalah toolkit untuk membangun Web API dengan Django.
- Menyediakan serialization, viewsets, dan authentication out-of-the-box.

AUTHENTICATION: Tiga layer keamanan
- dj-rest-auth: untuk endpoint login, logout, dan registrasi.
- django-allauth: untuk social authentication (Google, Facebook).
- SimpleJWT: untuk token-based authentication dengan HttpOnly cookies.

DATABASE: SQLite3 untuk development
- Ringan dan tidak perlu setup tambahan.
- Di production, bisa diganti dengan PostgreSQL atau MySQL.

DOCUMENTATION: drf-spectacular
- Auto-generate OpenAPI/Swagger documentation.
- Developer bisa test API langsung dari browser.

EXTRAS:
- django-cors-headers: untuk mengizinkan cross-origin requests dari frontend.
- django-filter: untuk fitur filtering dan searching di API.
- Pillow: untuk handling upload gambar (KTP, bukti transfer)."
```

---

### B. TECH STACK FRONTEND (1.5 menit)

> **[TAMPILAN: Logo Vue, Vite, TailwindCSS]**

```
"Sekarang FRONTEND.

FRAMEWORK: Vue.js 3 dengan Composition API
- Vue 3 adalah framework JavaScript modern yang reaktif dan performant.
- Saya menggunakan Composition API untuk code organization yang lebih baik.

BUILD TOOL: Vite
- Vite adalah build tool next-generation yang sangat cepat.
- Hot Module Replacement (HMR) instan — perubahan code langsung terlihat.
- Proxy configuration untuk menghindari CORS issues saat development.

STYLING: TailwindCSS
- Utility-first CSS framework.
- Konsisten dan cepat dalam styling.

STATE MANAGEMENT: Pinia
- Official state management untuk Vue 3.
- Lebih ringan dan type-safe dibanding Vuex.

HTTP CLIENT: Axios
- Untuk komunikasi dengan backend API.
- Dilengkapi interceptor untuk auto-attach JWT token dan handle token refresh.

VISUALIZATION: Chart.js dengan vue-chartjs wrapper
- Untuk grafik pendapatan bulanan.

ANIMATION: Motion-V (Vue Motion)
- Animasi deklaratif yang smooth dan performant.

ICONS: Lucide Vue
- Icon library yang modern dan konsisten."
```

---

### C. ALUR KOMUNIKASI FRONTEND-BACKEND (2 menit)

> **[TAMPILAN: Diagram Flow Request/Response]**

```
"Bagaimana frontend dan backend berkomunikasi?

Mari kita lihat alur lengkapnya:

1. USER MENGAKSES FRONTEND
   User membuka browser dan mengakses http://localhost:5173
   Ini adalah Vite development server.

2. FRONTEND MELAKUKAN API CALL
   Ketika user login atau mengakses data, frontend mengirim request 
   ke endpoint /api/...
   
   Vite memiliki proxy configuration yang mem-forward request ini 
   ke Django backend di http://127.0.0.1:8000

3. DJANGO MEMPROSES REQUEST
   - Authentication middleware mengecek JWT token.
   - ViewSet memproses business logic.
   - Serializer mengubah data dari/ke JSON.
   - Response dikirim kembali ke frontend.

4. FRONTEND MENAMPILKAN DATA
   - Pinia store menyimpan data di memory.
   - Vue reactivity system otomatis mengupdate tampilan.

Yang menarik adalah JWT token handling-nya:
- Access token disimpan di memory (Pinia store) — lebih aman.
- Refresh token disimpan di localStorage untuk session persistence.
- Axios interceptor otomatis attach token ke setiap request.
- Jika access token expired, sistem otomatis refresh tanpa user tahu."
```

---

# 🎬 BAGIAN 3: DEMO APLIKASI
**[08:00 - 16:00]**

## 🎤 SKRIP NARASI:

> **[TAMPILAN: Aplikasi berjalan di browser]**

---

### A. HALAMAN LOGIN (1 menit)

```
"Sekarang mari kita demo aplikasinya.

[BUKA BROWSER: http://localhost:5173/login]

Ini adalah halaman login. Saya sudah mendesain dengan tampilan modern — 
ada gradient background, card dengan shadow, dan animasi smooth saat load.

Ada 3 cara untuk login:
1. Login dengan username/email dan password — yang sudah teregistrasi.
2. Login dengan Google (Social Authentication).
3. Registrasi akun baru untuk user yang belum punya akun.

Mari saya login dengan akun yang sudah ada...

[DEMO: Input credentials dan klik Login]

Perhatikan setelah login, kita langsung redirect ke Dashboard. 
Token JWT sudah tersimpan di memory dan session kita aktif."
```

---

### B. DASHBOARD OVERVIEW (2 menit)

```
"Ini adalah DASHBOARD — halaman utama setelah login.

[TUNJUK: Stat cards di atas]

Di bagian atas ada 3 stat cards:
- Total Kamar: menunjukkan ada berapa unit kamar yang terdaftar.
- Terisi: berapa kamar yang sudah ada penyewanya.
- Kosong: berapa kamar yang masih available.

Perhatikan angka-angka ini di-fetch secara real-time dari API.

[TUNJUK: Filter buttons]

Di sini ada filter buttons — Semua, Kosong, Terisi.
Ketika saya klik 'Kosong'...

[DEMO: Klik filter Kosong]

...hanya kamar dengan status KOSONG yang ditampilkan.

[TUNJUK: Kamar cards]

Setiap kamar ditampilkan dalam bentuk card yang informatif:
- Nomor kamar
- Tipe kamar (VIP, Standard, dll)
- Harga per bulan
- Lantai
- Status dengan badge berwarna (hijau untuk kosong, merah untuk terisi)

[DEMO: Hover di salah satu card]

Kalau saya hover, ada micro-animation subtle yang membuat tampilan 
lebih hidup dan interaktif."
```

---

### C. CHECK-IN PENYEWA (2 menit)

```
"Sekarang saya akan demo proses CHECK-IN penyewa baru.

[DEMO: Klik kamar yang statusnya KOSONG]

Saya klik kamar A02 yang masih kosong... muncul modal detail.

[TUNJUK: Modal detail kamar]

Di modal ini terlihat informasi lengkap kamar, dan ada tombol 'Check-In'.

[DEMO: Klik tombol Check-In]

Muncul form check-in. Saya isi data penyewa:
- Nama Lengkap: [isi contoh]
- Nomor HP: [isi contoh]  
- Durasi Sewa: [pilih 3 bulan]

[DEMO: Klik Submit]

SUKSES! Perhatikan dua hal yang terjadi secara OTOMATIS:
1. Penyewa baru tersimpan di database.
2. Status kamar A02 berubah dari 'KOSONG' menjadi 'TERISI'.

Ini adalah contoh 'Automation Magic' yang saya implementasikan 
menggunakan Django Signals. Saya akan jelaskan nanti di bagian coding."
```

---

### D. HALAMAN MASTER DATA KAMAR (1.5 menit)

```
"Mari kita ke halaman MASTER DATA KAMAR.

[DEMO: Klik menu 'Kamar' di sidebar]

Ini adalah tampilan tabel dengan fitur lengkap:
- Search bar untuk pencarian berdasarkan nomor kamar.
- Dropdown filter berdasarkan status.
- Dropdown untuk jumlah data per halaman.

[TUNJUK: Tabel]

Tabel menampilkan: Nomor, Tipe, Lantai, Status, Harga, dan tombol Aksi.

[DEMO: Klik Tambah Kamar]

Untuk menambah kamar baru, saya klik tombol 'Tambah Kamar'.
Muncul modal form dengan field:
- Nomor Kamar
- Pilih Tipe Kamar (dari dropdown yang diisi dari API)
- Lantai

[DEMO: Klik Edit di salah satu kamar]

Untuk edit, saya klik icon pensil... form terisi dengan data existing.

[DEMO: Klik Delete]

Untuk hapus, ada konfirmasi dialog dengan pesan warning.
Ini penting untuk mencegah penghapusan tidak sengaja."
```

---

### E. HALAMAN PENYEWA (1.5 menit)

```
"Sekarang halaman MANAGE PENYEWA.

[DEMO: Klik menu 'Penyewa' di sidebar]

Tampilan mirip dengan master kamar, tapi fokus ke data penyewa.

Informasi yang ditampilkan:
- Nama penyewa
- Nomor HP
- Kamar yang ditempati
- Tanggal masuk
- Durasi sewa
- Status (aktif atau sudah checkout)

[DEMO: Klik salah satu penyewa untuk detail]

Di detail, kita bisa lihat semua informasi termasuk foto KTP yang diupload.

FITUR CHECK-OUT:
Ketika penyewa pindah, juragan cukup klik 'Check-Out'.
Sistem otomatis menghapus data penyewa dan mengubah status kamar 
kembali ke 'KOSONG'. Lagi-lagi, ini menggunakan Django Signals."
```

---

### F. HALAMAN KEUANGAN (2 menit)

```
"Terakhir, halaman yang paling disukai juragan — LAPORAN KEUANGAN.

[DEMO: Klik menu 'Keuangan' di sidebar]

Di sini ada beberapa komponen penting:

[TUNJUK: Summary Cards]

DUA SUMMARY CARDS:
- Pendapatan Bulan Ini: total pembayaran yang masuk bulan berjalan.
- Total Pendapatan: akumulasi semua pembayaran sejak aplikasi digunakan.

[TUNJUK: Grafik Bar Chart]

GRAFIK PENDAPATAN BULANAN:
Visualisasi yang jelas untuk melihat trend pendapatan.
Sumbu X menunjukkan bulan, sumbu Y menunjukkan nominal.
Juragan bisa lihat kapan pendapatan tinggi atau rendah.

[TUNJUK: Riwayat Transaksi]

RIWAYAT TRANSAKSI:
5 transaksi terakhir dengan informasi:
- Nama penyewa yang bayar
- Nominal pembayaran
- Tanggal bayar
- Keterangan (contoh: 'Bayar Kost Januari 2026')

[DEMO: Klik Catat Pemasukan]

Untuk input pembayaran baru, juragan klik 'Catat Pemasukan'.
Form muncul dengan:
- Dropdown pilih penyewa
- Nominal pembayaran
- Keterangan
- Upload bukti transfer (optional)

Data langsung ter-refresh setelah submit, dan grafik terupdate otomatis."
```

---

# 🎬 BAGIAN 4: PENJELASAN KODING
**[16:00 - 26:00]**

## 🎤 SKRIP NARASI:

> **[TAMPILAN: Visual Studio Code dengan project terbuka]**

---

### A. STRUKTUR PROJECT (2 menit)

> **[TAMPILAN: File explorer VS Code]**

```
"Sekarang bagian yang ditunggu-tunggu — BREAKDOWN CODING.

Mari kita lihat struktur project:

[TUNJUK: Folder project_sultan]

BACKEND (project_sultan/):
├── project_sultan/     ← Django project settings
│   ├── settings.py    ← Semua konfigurasi
│   ├── urls.py        ← Root URL routing
│   └── adapters.py    ← Custom adapters untuk social auth
│
├── kost/               ← Main Django app
│   ├── models.py      ← Database models (4 tabel)
│   ├── views.py       ← API ViewSets & custom views
│   ├── serializers.py ← DRF serializers
│   ├── api_urls.py    ← API routing
│   └── admin.py       ← Django admin config
│
└── media/             ← Uploaded files (KTP, bukti bayar)

[TUNJUK: Folder frontend-sultan-vue]

FRONTEND (frontend-sultan-vue/):
├── src/
│   ├── views/         ← Page components (6 halaman)
│   ├── components/    ← Reusable components
│   ├── stores/        ← Pinia stores (auth, kamar, penyewa, keuangan)
│   ├── services/      ← API service & utilities
│   ├── router/        ← Vue Router configuration
│   └── assets/        ← Static assets

Jadi ini adalah arsitektur decoupled yang jelas — 
backend dan frontend benar-benar terpisah."
```

---

### B. DATABASE MODELS (2.5 menit)

> **[TAMPILAN: File models.py]**

```
"Mari kita mulai dari MODELS — jantung dari backend Django.

[BUKA: project_sultan/kost/models.py]

Ada 4 model dengan relasi yang terstruktur:

1. TIPE KAMAR (class TipeKamar)
   - Ini adalah tabel 'kasta' atau kategori kamar.
   - Field: nama_tipe, harga_per_bulan, fasilitas.
   - Contoh: 'VIP' seharga 2.000.000 dengan AC dan kamar mandi dalam.

2. KAMAR (class Kamar)
   - Tabel unit kamar fisik.
   - Field: nomor_kamar, lantai, status (KOSONG/ISI/MAINTENANCE).
   - RELASI: ForeignKey ke TipeKamar — satu tipe bisa punya banyak kamar.
   - Perhatikan 'related_name=kamar_list' untuk reverse relation.

3. PENYEWA (class Penyewa)
   - Data penyewa yang menempati kamar.
   - Field: nama_lengkap, nomor_hp, ktp_foto, tanggal_masuk, durasi_sewa.
   - RELASI: OneToOneField ke Kamar — satu kamar hanya satu penyewa.
   - Ini memastikan tidak ada double booking.

4. RIWAYAT PEMBAYARAN (class RiwayatPembayaran)
   - Catatan setiap transaksi pembayaran.
   - Field: jumlah, tanggal_bayar, keterangan, bukti_transfer.
   - RELASI: ForeignKey ke Penyewa — satu penyewa bisa banyak pembayaran.

[TUNJUK: Bagian Signals]

AUTOMATION MAGIC DENGAN SIGNALS:

@receiver(post_save, sender=Penyewa)
def update_kamar_isi(...)

Ini adalah Django Signal. Ketika penyewa baru DISIMPAN (post_save),
fungsi ini otomatis jalan dan mengubah status kamar menjadi 'ISI'.

@receiver(post_delete, sender=Penyewa)
def update_kamar_kosong(...)

Sebaliknya, ketika penyewa DIHAPUS (post_delete atau check-out),
status kamar otomatis kembali ke 'KOSONG'.

Ini adalah contoh business logic yang di-handle di level database,
bukan di level view. Lebih aman dan konsisten."
```

---

### C. SERIALIZERS (1.5 menit)

> **[TAMPILAN: File serializers.py]**

```
"Sekarang SERIALIZERS — jembatan antara Django models dan JSON API.

[BUKA: project_sultan/kost/serializers.py]

DRF Serializers berfungsi untuk:
1. Validasi input data dari frontend.
2. Konversi Python objects ke JSON (serialization).
3. Konversi JSON ke Python objects (deserialization).

CONTOH SMART SERIALIZER:

class KamarSerializer(serializers.ModelSerializer):
    tipe_detail = TipeKamarSerializer(source='tipe', read_only=True)
    
    class Meta:
        model = Kamar
        fields = ['id', 'nomor_kamar', 'tipe', 'tipe_detail', 'lantai', 'status']

Ada trik menarik di sini — NESTED SERIALIZER.

- Field 'tipe' untuk INPUT: hanya terima ID (integer).
- Field 'tipe_detail' untuk OUTPUT: return JSON lengkap tipe kamar.

Ini artinya:
- Saat CREATE/UPDATE: frontend kirim { tipe: 1 }
- Saat GET: response include { tipe_detail: { nama_tipe: 'VIP', harga: 2000000, ... } }

Lebih efisien dan frontend tidak perlu request terpisah untuk data tipe."
```

---

### D. VIEWS - API ENDPOINTS (2 menit)

> **[TAMPILAN: File views.py]**

```
"Sekarang VIEWS — tempat business logic API berada.

[BUKA: project_sultan/kost/views.py]

Saya menggunakan DRF VIEWSETS, yang menyediakan CRUD operations 
secara otomatis tanpa banyak boilerplate code.

CONTOH VIEWSET STANDAR:

class KamarViewSet(viewsets.ModelViewSet):
    queryset = Kamar.objects.all().order_by('nomor_kamar')
    serializer_class = KamarSerializer
    pagination_class = None  # Frontend handles pagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'lantai', 'tipe']
    search_fields = ['nomor_kamar']

Dengan konfigurasi ini, API otomatis support:
- GET /api/kamar/ → List semua kamar
- POST /api/kamar/ → Create kamar baru
- GET /api/kamar/{id}/ → Detail satu kamar
- PATCH /api/kamar/{id}/ → Update kamar
- DELETE /api/kamar/{id}/ → Hapus kamar
- Filter: ?status=KOSONG
- Search: ?search=A01

[TUNJUK: FinancialSummaryView]

CUSTOM API VIEW:

class FinancialSummaryView(APIView):

Untuk data keuangan, saya buat custom view karena butuh agregasi kompleks:
- Total pendapatan all-time (aggregate Sum).
- Pendapatan bulan ini (filter by current month).
- Data grafik per bulan (annotate TruncMonth + group by).
- 5 transaksi terakhir (select_related untuk optimasi query).

Semua di-return dalam satu response untuk efisiensi — 
frontend cukup satu API call untuk seluruh halaman Keuangan."
```

---

### E. URL ROUTING (1 menit)

> **[TAMPILAN: File urls.py dan api_urls.py]**

```
"Bagaimana semua endpoint terintegrasi? Lewat URL ROUTING.

[BUKA: project_sultan/project_sultan/urls.py]

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication (dj-rest-auth + JWT)
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Social Authentication
    path('accounts/', include('allauth.urls')),
    
    # API Endpoints
    path('api/', include('kost.api_urls')),
    
    # Documentation
    path('api/docs/', SpectacularSwaggerView.as_view()),
]

[BUKA: kost/api_urls.py]

router = DefaultRouter()
router.register(r'tipe-kamar', TipeKamarViewSet)
router.register(r'kamar', KamarViewSet)
router.register(r'penyewa', PenyewaViewSet)
router.register(r'riwayat-bayar', RiwayatPembayaranViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('financial-summary/', FinancialSummaryView.as_view()),
]

DRF Router otomatis generate URL pattern untuk setiap ViewSet.
Ini mengurangi boilerplate code secara signifikan."
```

---

### F. FRONTEND - PINIA STORE (1.5 menit)

> **[TAMPILAN: File kamar.ts di stores/]**

```
"Sekarang masuk ke FRONTEND — dimulai dari STATE MANAGEMENT dengan Pinia.

[BUKA: frontend-sultan-vue/src/stores/kamar.ts]

Pinia Store struktur-nya:

export const useKamarStore = defineStore('kamar', () => {
  // STATE - reactive data
  const items = ref<Kamar[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // COMPUTED - derived state
  const totalKamar = computed(() => items.value.length)
  const totalTerisi = computed(() => items.value.filter(k => k.status === 'ISI').length)

  // ACTIONS - async operations
  async function fetchAll() {
    loading.value = true
    const res = await api.get('kamar/')
    items.value = res.data
    loading.value = false
  }

  async function create(payload) {
    await api.post('kamar/', payload)
    await fetchAll() // Refresh data
  }

  return { items, loading, totalKamar, fetchAll, create, ... }
})

KONSEP PENTING:
- State terpusat — semua komponen akses data dari satu tempat.
- Reactivity — perubahan state otomatis trigger re-render komponen.
- Actions — operasi async yang memanggil API.
- Computed — kalkulasi yang di-cache dan hanya recalculate saat dependency berubah."
```

---

### G. FRONTEND - API SERVICE & INTERCEPTORS (1.5 menit)

> **[TAMPILAN: File api.ts]**

```
"Untuk komunikasi dengan backend, saya buat API SERVICE dengan Axios.

[BUKA: frontend-sultan-vue/src/services/api.ts]

const api: AxiosInstance = axios.create({
  baseURL: '/api/',  // Go through Vite proxy
  withCredentials: true,  // Send cookies
})

// REQUEST INTERCEPTOR - Attach JWT token
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  const token = authStore.accessToken
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

Setiap request otomatis attach Bearer token dari auth store.

// RESPONSE INTERCEPTOR - Auto refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Access token expired, try refresh
      const refreshed = await authStore.refreshToken()
      if (refreshed) {
        return api(originalRequest) // Retry original request
      } else {
        window.location.href = '/login'
      }
    }
  }
)

Kalau dapat error 401 (Unauthorized):
- Otomatis coba refresh token.
- Kalau berhasil, retry request original.
- Kalau gagal, redirect ke login.

User tidak merasakan apa-apa — session tetap lancar."
```

---

### H. FRONTEND - VUE COMPONENT (1.5 menit)

> **[TAMPILAN: File DashboardView.vue]**

```
"Terakhir, contoh VUE COMPONENT untuk halaman Dashboard.

[BUKA: frontend-sultan-vue/src/views/DashboardView.vue]

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useKamarStore } from '@/stores/kamar'

const kamarStore = useKamarStore()
const activeFilter = ref('ALL')

const filteredKamar = computed(() => {
  if (activeFilter.value === 'ALL') return kamarStore.items
  return kamarStore.items.filter(k => k.status === activeFilter.value)
})

onMounted(() => {
  kamarStore.fetchAll()
  kamarStore.fetchTipeKamar()
})
</script>

PATTERN YANG DIGUNAKAN:

1. COMPOSITION API
   Setup function dengan ref, computed, dan lifecycle hooks.
   Lebih clean dan type-safe dibanding Options API.

2. PINIA INTEGRATION
   useKamarStore() untuk akses state dan actions.
   Data otomatis reaktif.

3. COMPUTED PROPERTIES
   filteredKamar() hanya recalculate saat items atau filter berubah.
   Performa optimal untuk list besar.

4. LIFECYCLE HOOKS
   onMounted() untuk fetch data saat komponen ready.

<template>
  <div class="grid grid-cols-3 gap-6">
    <motion.div v-for="kamar in filteredKamar">
      ...
    </motion.div>
  </div>
</template>

Template menggunakan Tailwind CSS untuk styling cepat,
dan Motion-V untuk animasi deklaratif."
```

---

# 🎬 BAGIAN 5: CLOSING
**[26:00 - 27:00]**

## 🎤 SKRIP NARASI:

> **[TAMPILAN: Slide closing dengan summary]**

```
"Baik, mari kita wrap up presentasi hari ini.

KESIMPULAN:

1. SULTAN adalah aplikasi manajemen kost modern dengan arsitektur DECOUPLED
   - Backend: Django + Django REST Framework
   - Frontend: Vue.js 3 + Vite + Pinia + TailwindCSS

2. Arsitektur ini memberikan:
   - Separation of concerns yang jelas
   - Skalabilitas untuk multi-platform (web, mobile)
   - Developer experience yang optimal

3. Fitur utama:
   - Manajemen kamar dengan automation (Django Signals)
   - Manajemen penyewa dengan tracking lengkap
   - Laporan keuangan dengan visualisasi grafik
   - Authentication dengan JWT dan Social Login

4. Best practices yang diterapkan:
   - RESTful API design
   - Token-based authentication dengan auto-refresh
   - Reactive state management
   - Clean code architecture

Demikian presentasi dari saya. Terima kasih atas perhatiannya.
Wassalamualaikum warahmatullahi wabarakatuh."
```

---

# 📝 TIPS PRESENTASI

## Do's ✅
- Siapkan aplikasi sudah berjalan sebelum recording (backend + frontend).
- Gunakan dummy data yang realistis (nama Indonesia, nominal masuk akal).
- Berbicara dengan pace yang tenang dan jelas.
- Perhatikan kursor saat menunjuk UI element.
- Test audio dan recording quality sebelum take final.

## Don'ts ❌
- Jangan terlalu cepat switch antara slides dan demo.
- Jangan skip penjelasan walau terasa "obvious" bagi developer.
- Jangan lupa menjelaskan MENGAPA, bukan hanya APA.
- Jangan rekam dengan notifikasi browser/sistem aktif.

## Tools yang Disarankan untuk Recording
- **Screen Recording**: OBS Studio (free) atau Camtasia.
- **Editing**: DaVinci Resolve (free) atau Adobe Premiere.
- **Slides**: Google Slides atau PowerPoint.

