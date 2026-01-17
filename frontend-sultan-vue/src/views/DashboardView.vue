<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { motion } from 'motion-v'
import { Building, UserCheck, DoorOpen, Plus, X, Layers, Eye, Pencil, Trash2 } from 'lucide-vue-next'
import { useKamarStore, type Kamar, type TipeKamar } from '@/stores/kamar'
import { usePenyewaStore, type Penyewa } from '@/stores/penyewa'
import { useToastStore } from '@/stores/toast'
import { formatRupiah } from '@/services/utils'

const kamarStore = useKamarStore()
const penyewaStore = usePenyewaStore()
const toast = useToastStore()
const activeFilter = ref<'ALL' | 'KOSONG' | 'ISI'>('ALL')

// Modal states
const showAddKamarModal = ref(false)
const showCheckInModal = ref(false)
const showDetailModal = ref(false)
const showAddTipeModal = ref(false)
const showViewTipeModal = ref(false)
const showEditTipeModal = ref(false)
const selectedKamar = ref<Kamar | null>(null)
const selectedPenyewa = ref<Penyewa | null>(null)
const selectedTipe = ref<TipeKamar | null>(null)
const isSubmitting = ref(false)

// Form states
const addKamarForm = ref({ nomor_kamar: '', lantai: 1, tipe: '', status: 'KOSONG' })
const checkInForm = ref({ nama_lengkap: '', nomor_hp: '', durasi_sewa_bulan: 1 })
const addTipeForm = ref({ nama_tipe: '', harga_per_bulan: '', fasilitas: '' })
const editTipeForm = ref({ nama_tipe: '', harga_per_bulan: '', fasilitas: '' })

const filteredKamar = computed(() => {
  if (activeFilter.value === 'ALL') return kamarStore.items
  return kamarStore.items.filter(k => k.status === activeFilter.value)
})

function setFilter(filter: 'ALL' | 'KOSONG' | 'ISI') {
  activeFilter.value = filter
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'KOSONG': return { text: 'Kosong', class: 'bg-emerald-500 text-white' }
    case 'ISI': return { text: 'Terisi', class: 'bg-rose-500 text-white' }
    default: return { text: 'Maintenance', class: 'bg-amber-500 text-white' }
  }
}

// === MODAL HANDLERS ===
function openAddKamarModal() {
  addKamarForm.value = { nomor_kamar: '', lantai: 1, tipe: '', status: 'KOSONG' }
  if (kamarStore.tipeKamarList.length === 0) kamarStore.fetchTipeKamar()
  showAddKamarModal.value = true
}

function openCheckInModal(kamar: Kamar) {
  selectedKamar.value = kamar
  checkInForm.value = { nama_lengkap: '', nomor_hp: '', durasi_sewa_bulan: 1 }
  showCheckInModal.value = true
}

async function openDetailModal(kamar: Kamar) {
  selectedKamar.value = kamar
  selectedPenyewa.value = null // Reset before fetching
  const penyewa = await penyewaStore.getByKamar(kamar.id)
  selectedPenyewa.value = penyewa
  showDetailModal.value = true
}

function openAddTipeModal() {
  addTipeForm.value = { nama_tipe: '', harga_per_bulan: '', fasilitas: '' }
  showAddTipeModal.value = true
}

function openViewTipeModal() {
  if (kamarStore.tipeKamarList.length === 0) kamarStore.fetchTipeKamar()
  showViewTipeModal.value = true
}

function openEditTipeModal(tipe: TipeKamar) {
  selectedTipe.value = tipe
  editTipeForm.value = {
    nama_tipe: tipe.nama_tipe,
    harga_per_bulan: String(tipe.harga_per_bulan),
    fasilitas: tipe.fasilitas || ''
  }
  showEditTipeModal.value = true
}

// === SUBMIT HANDLERS ===
async function submitAddKamar() {
  if (!addKamarForm.value.nomor_kamar || !addKamarForm.value.tipe) {
    toast.warning('Validasi', 'Nomor kamar dan tipe wajib diisi!')
    return
  }
  isSubmitting.value = true
  try {
    await kamarStore.create({
      nomor_kamar: addKamarForm.value.nomor_kamar,
      lantai: addKamarForm.value.lantai,
      tipe: Number(addKamarForm.value.tipe),
      status: addKamarForm.value.status as 'KOSONG' | 'ISI' | 'MAINTENANCE'
    })
    showAddKamarModal.value = false
    toast.success('Berhasil', 'Kamar berhasil ditambahkan!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal menambah kamar')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCheckIn() {
  if (!checkInForm.value.nama_lengkap || !checkInForm.value.nomor_hp) {
    toast.warning('Validasi', 'Nama dan nomor HP wajib diisi!')
    return
  }
  if (!selectedKamar.value) {
    toast.error('Error', 'Kamar tidak valid!')
    return
  }
  isSubmitting.value = true
  try {
    await penyewaStore.create({
      nama_lengkap: checkInForm.value.nama_lengkap,
      nomor_hp: checkInForm.value.nomor_hp,
      durasi_sewa_bulan: checkInForm.value.durasi_sewa_bulan,
      kamar: selectedKamar.value.id
    })
    await kamarStore.fetchAll()
    showCheckInModal.value = false
    toast.success('Check-In Berhasil', 'Penyewa baru telah ditambahkan.')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal melakukan check-in')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCheckOut() {
  if (!selectedPenyewa.value) {
    toast.error('Error', 'Data penyewa tidak ditemukan!')
    return
  }
  
  isSubmitting.value = true
  try {
    await penyewaStore.remove(selectedPenyewa.value.id)
    await kamarStore.fetchAll()
    showDetailModal.value = false
    selectedPenyewa.value = null
    selectedKamar.value = null
    toast.success('Check-Out Berhasil', 'Kamar sekarang kosong.')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal melakukan check-out')
  } finally {
    isSubmitting.value = false
  }
}

async function submitAddTipe() {
  if (!addTipeForm.value.nama_tipe || !addTipeForm.value.harga_per_bulan) {
    toast.warning('Validasi', 'Nama tipe dan harga wajib diisi!')
    return
  }
  isSubmitting.value = true
  try {
    await kamarStore.createTipeKamar({
      nama_tipe: addTipeForm.value.nama_tipe,
      harga_per_bulan: Number(addTipeForm.value.harga_per_bulan),
      fasilitas: addTipeForm.value.fasilitas
    })
    showAddTipeModal.value = false
    toast.success('Berhasil', 'Tipe Kamar berhasil ditambahkan!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal menambah tipe kamar')
  } finally {
    isSubmitting.value = false
  }
}

async function submitEditTipe() {
  if (!selectedTipe.value) return
  isSubmitting.value = true
  try {
    await kamarStore.updateTipeKamar(selectedTipe.value.id, {
      nama_tipe: editTipeForm.value.nama_tipe,
      harga_per_bulan: Number(editTipeForm.value.harga_per_bulan),
      fasilitas: editTipeForm.value.fasilitas
    })
    showEditTipeModal.value = false
    toast.success('Berhasil', 'Tipe Kamar berhasil diperbarui!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal memperbarui tipe kamar')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteTipe(tipe: TipeKamar) {
  if (!confirm(`Yakin hapus tipe "${tipe.nama_tipe}"?`)) return
  try {
    await kamarStore.removeTipeKamar(tipe.id)
    toast.success('Berhasil', 'Tipe Kamar berhasil dihapus!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal menghapus tipe kamar. Mungkin masih digunakan oleh kamar.')
  }
}

onMounted(() => {
  kamarStore.fetchAll()
  kamarStore.fetchTipeKamar()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3 }" class="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-all group">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Aset</p>
            <h3 class="font-display text-4xl font-bold text-slate-800">{{ kamarStore.totalKamar }}</h3>
          </div>
          <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Building class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-500">Unit Kamar Terdaftar</div>
      </motion.div>

      <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3, delay: 0.1 }" class="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-all group">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Terisi (Cuan)</p>
            <h3 class="font-display text-4xl font-bold text-slate-800">{{ kamarStore.totalTerisi }}</h3>
          </div>
          <div class="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <UserCheck class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-500 flex items-center gap-1">
          <span class="w-2 h-2 bg-rose-500 rounded-full"></span> Unit Menghasilkan Uang
        </div>
      </motion.div>

      <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3, delay: 0.2 }" class="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-all group">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Kosong (Siap Jual)</p>
            <h3 class="font-display text-4xl font-bold text-slate-800">{{ kamarStore.totalKosong }}</h3>
          </div>
          <div class="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <DoorOpen class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-500 flex items-center gap-1">
          <span class="w-2 h-2 bg-teal-500 rounded-full"></span> Unit Siap Huni
        </div>
      </motion.div>
    </div>

    <!-- Action Buttons Row -->
    <div class="flex flex-wrap justify-between items-center gap-4">
      <!-- Left: Filters -->
      <div class="flex bg-white border border-slate-200 p-1 rounded-xl">
        <button v-for="filter in ['ALL', 'KOSONG', 'ISI'] as const" :key="filter" @click="setFilter(filter)" :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', activeFilter === filter ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100']">
          {{ filter === 'ALL' ? 'Semua' : filter === 'KOSONG' ? 'Kosong' : 'Terisi' }}
        </button>
      </div>
      
      <!-- Right: Action Buttons -->
      <div class="flex gap-2 flex-wrap">
        <motion.button @click="openViewTipeModal" class="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" :whileHover="{ scale: 1.02 }" :whileTap="{ scale: 0.98 }">
          <Eye class="w-4 h-4" />
          Lihat Tipe Kamar
        </motion.button>
        <motion.button @click="openAddTipeModal" class="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl transition-colors" :whileHover="{ scale: 1.02 }" :whileTap="{ scale: 0.98 }">
          <Layers class="w-4 h-4" />
          Tambah Tipe Kamar
        </motion.button>
        <motion.button @click="openAddKamarModal" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-colors" :whileHover="{ scale: 1.02 }" :whileTap="{ scale: 0.98 }">
          <Plus class="w-4 h-4" />
          Tambah Kamar
        </motion.button>
      </div>
    </div>

    <!-- Kamar Grid -->
    <div v-if="kamarStore.loading" class="text-center py-12 text-slate-400">Memuat data aset juragan...</div>
    <div v-else-if="filteredKamar.length === 0" class="text-center py-12 text-slate-400">Tidak ada data kamar.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
      <motion.div v-for="(kamar, index) in filteredKamar" :key="kamar.id" :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.3, delay: index * 0.05 }" class="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300" :class="{ 'hover:border-teal-400': kamar.status === 'KOSONG', 'hover:border-rose-400': kamar.status === 'ISI', 'hover:border-orange-400': kamar.status === 'MAINTENANCE' }">
        <div class="p-5 border-b border-slate-50 flex justify-between items-start">
          <div>
            <h3 class="font-display text-2xl font-bold text-slate-800">{{ kamar.nomor_kamar }}</h3>
            <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{{ kamar.tipe_detail.nama_tipe }}</p>
          </div>
          <span :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusBadge(kamar.status).class]">{{ getStatusBadge(kamar.status).text }}</span>
        </div>
        <div class="p-5 space-y-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Lantai</span>
            <span class="font-semibold text-slate-700">{{ kamar.lantai }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Harga</span>
            <span class="font-bold text-indigo-600">{{ formatRupiah(kamar.tipe_detail.harga_per_bulan) }} <span class="text-xs text-slate-400 font-normal">/bulan</span></span>
          </div>
          <div class="pt-2">
            <button v-if="kamar.status === 'KOSONG'" @click="openCheckInModal(kamar)" class="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">Check In</button>
            <button v-else-if="kamar.status === 'ISI'" @click="openDetailModal(kamar)" class="w-full px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors">Detail Penyewa</button>
            <button v-else class="w-full px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed" disabled>Perbaikan</button>
          </div>
        </div>
      </motion.div>
    </div>

    <!-- ========== MODALS ========== -->

    <!-- Add Kamar Modal -->
    <Teleport to="body">
      <div v-if="showAddKamarModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showAddKamarModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Tambah Kamar Baru</h3><p class="text-sm opacity-80">Isi detail kamar fisik</p></div>
            <button @click="showAddKamarModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nomor Kamar</label><input v-model="addKamarForm.nomor_kamar" type="text" placeholder="K001" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Lantai</label><input v-model="addKamarForm.lantai" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Tipe Kamar</label>
              <select v-model="addKamarForm.tipe" class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <option value="" disabled>Pilih tipe kamar</option>
                <option v-for="t in kamarStore.tipeKamarList" :key="t.id" :value="t.id">{{ t.nama_tipe }} - {{ formatRupiah(t.harga_per_bulan) }}</option>
              </select>
            </div>
            <div><label class="text-sm text-slate-600 mb-1 block">Status</label>
              <select v-model="addKamarForm.status" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
                <option value="KOSONG">KOSONG</option><option value="ISI">ISI</option><option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showAddKamarModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitAddKamar" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan Kamar' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Check-In Modal (Enhanced) -->
    <Teleport to="body">
      <div v-if="showCheckInModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCheckInModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Check In: {{ selectedKamar?.nomor_kamar }}</h3><p class="text-sm opacity-80">Masukkan data penyewa baru</p></div>
            <button @click="showCheckInModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <!-- Room Info Display -->
            <div v-if="selectedKamar" class="bg-indigo-50 border border-indigo-200 p-4 rounded-xl space-y-2">
              <h4 class="font-bold text-indigo-800 text-sm uppercase tracking-wider">Info Kamar</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-slate-500">Tipe:</span> <strong class="text-slate-800">{{ selectedKamar.tipe_detail.nama_tipe }}</strong></div>
                <div><span class="text-slate-500">Lantai:</span> <strong class="text-slate-800">{{ selectedKamar.lantai }}</strong></div>
                <div class="col-span-2"><span class="text-slate-500">Harga:</span> <strong class="text-indigo-600">{{ formatRupiah(selectedKamar.tipe_detail.harga_per_bulan) }}/bulan</strong></div>
                <div v-if="selectedKamar.tipe_detail.fasilitas" class="col-span-2"><span class="text-slate-500">Fasilitas:</span> <span class="text-slate-700">{{ selectedKamar.tipe_detail.fasilitas }}</span></div>
              </div>
            </div>
            <hr class="border-slate-200"/>
            <div><label class="text-sm text-slate-600 mb-1 block">Nama Lengkap Penyewa</label><input v-model="checkInForm.nama_lengkap" type="text" placeholder="Masukkan nama lengkap" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Nomor HP</label><input v-model="checkInForm.nomor_hp" type="text" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Durasi Sewa (Bulan)</label><input v-model="checkInForm.durasi_sewa_bulan" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showCheckInModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitCheckIn" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Memproses...' : 'Simpan & Check In' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Detail Penyewa Modal (Fixed Check-Out) -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDetailModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Kamar {{ selectedKamar?.nomor_kamar }}</h3><p class="text-sm opacity-80">Detail Penghuni Saat Ini</p></div>
            <button @click="showDetailModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6">
            <div v-if="selectedPenyewa" class="text-center mb-6">
              <div class="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl font-bold">{{ selectedPenyewa.nama_lengkap.charAt(0) }}</div>
              <h3 class="font-bold text-xl text-slate-800">{{ selectedPenyewa.nama_lengkap }}</h3>
              <p class="text-sm text-slate-500">{{ selectedPenyewa.nomor_hp }}</p>
            </div>
            <div v-if="selectedPenyewa" class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
              <div><span class="text-xs text-slate-400 block">Tanggal Masuk</span><span class="font-semibold">{{ selectedPenyewa.tanggal_masuk }}</span></div>
              <div><span class="text-xs text-slate-400 block">Durasi</span><span class="font-semibold">{{ selectedPenyewa.durasi_sewa_bulan }} Bulan</span></div>
            </div>
            <div v-else class="text-center py-8 text-slate-400">
              <p>Data penyewa tidak ditemukan.</p>
              <p class="text-xs mt-2">Mungkin kamar ini sudah kosong.</p>
            </div>
            <!-- CHECK OUT BUTTON -->
            <div v-if="selectedPenyewa" class="mt-6">
              <button @click="submitCheckOut" :disabled="isSubmitting" class="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                {{ isSubmitting ? 'Memproses...' : '🚪 CHECK OUT / HAPUS PENYEWA' }}
              </button>
              <p class="text-xs text-center text-slate-400 mt-2">Kamar akan menjadi kosong setelah check-out.</p>
            </div>
          </div>
          <div class="flex justify-end p-6 pt-0"><button @click="showDetailModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Tutup</button></div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Add Tipe Kamar Modal -->
    <Teleport to="body">
      <div v-if="showAddTipeModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showAddTipeModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-amber-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Tambah Tipe Kamar Baru</h3><p class="text-sm opacity-80">Definisikan kategori harga kamar</p></div>
            <button @click="showAddTipeModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nama Tipe</label><input v-model="addTipeForm.nama_tipe" type="text" placeholder="Standard / Deluxe / VIP" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Harga per Bulan (Rp)</label><input v-model="addTipeForm.harga_per_bulan" type="number" placeholder="1500000" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Fasilitas (opsional)</label><textarea v-model="addTipeForm.fasilitas" placeholder="AC, WiFi, Kamar Mandi Dalam, dll." class="w-full px-3 py-2 border border-slate-200 rounded-lg h-24 resize-none"></textarea></div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showAddTipeModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitAddTipe" :disabled="isSubmitting" class="px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan Tipe' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- View Tipe Kamar Modal -->
    <Teleport to="body">
      <div v-if="showViewTipeModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showViewTipeModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div class="bg-slate-800 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Daftar Tipe Kamar</h3><p class="text-sm opacity-80">{{ kamarStore.tipeKamarList.length }} tipe tersedia</p></div>
            <button @click="showViewTipeModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="kamarStore.tipeKamarList.length === 0" class="text-center py-8 text-slate-400">
              Belum ada tipe kamar. Tambahkan tipe baru untuk memulai.
            </div>
            <div v-else class="space-y-4">
              <div v-for="tipe in kamarStore.tipeKamarList" :key="tipe.id" class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-bold text-lg text-slate-800">{{ tipe.nama_tipe }}</h4>
                  <p class="text-indigo-600 font-semibold text-lg">{{ formatRupiah(tipe.harga_per_bulan) }}<span class="text-xs text-slate-400 font-normal">/bulan</span></p>
                  <p v-if="tipe.fasilitas" class="text-sm text-slate-500 mt-2">{{ tipe.fasilitas }}</p>
                </div>
                <div class="flex gap-1">
                  <button @click="openEditTipeModal(tipe)" class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil class="w-4 h-4" /></button>
                  <button @click="deleteTipe(tipe)" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end p-6 pt-0 border-t border-slate-100">
            <button @click="showViewTipeModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Tutup</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Edit Tipe Kamar Modal -->
    <Teleport to="body">
      <div v-if="showEditTipeModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showEditTipeModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Edit Tipe Kamar</h3></div>
            <button @click="showEditTipeModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nama Tipe</label><input v-model="editTipeForm.nama_tipe" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Harga per Bulan (Rp)</label><input v-model="editTipeForm.harga_per_bulan" type="number" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Fasilitas</label><textarea v-model="editTipeForm.fasilitas" class="w-full px-3 py-2 border border-slate-200 rounded-lg h-24 resize-none"></textarea></div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showEditTipeModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitEditTipe" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </div>
</template>
