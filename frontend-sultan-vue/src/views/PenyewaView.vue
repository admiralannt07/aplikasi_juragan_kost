<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { motion } from 'motion-v'
import { Pencil, CalendarPlus, Wallet, LogOut, X } from 'lucide-vue-next'
import { usePenyewaStore, type Penyewa } from '@/stores/penyewa'
import { useKeuanganStore } from '@/stores/keuangan'
import { useKamarStore } from '@/stores/kamar'
import { useToastStore } from '@/stores/toast'
import { formatDateShort, addMonths, formatRupiah } from '@/services/utils'

const penyewaStore = usePenyewaStore()
const keuanganStore = useKeuanganStore()
const kamarStore = useKamarStore()
const toast = useToastStore()

// Table state
const search = ref('')
const perPage = ref(10)
const currentPage = ref(1)

// Modal states
const showEditModal = ref(false)
const showPaymentModal = ref(false)
const showExtendModal = ref(false)
const showCheckoutModal = ref(false)
const selectedPenyewa = ref<Penyewa | null>(null)
const isSubmitting = ref(false)

// Form states
const editForm = ref({ nama_lengkap: '', nomor_hp: '', durasi_sewa_bulan: 1 })
const paymentForm = ref({ jumlah: '', keterangan: '' })
const extendForm = ref({ tambahan_bulan: 1 })

// Filtered data
const filteredPenyewa = computed(() => {
  if (!search.value) return penyewaStore.items
  const q = search.value.toLowerCase()
  return penyewaStore.items.filter(p =>
    p.nama_lengkap.toLowerCase().includes(q) ||
    p.nomor_hp.includes(q) ||
    (p.kamar_detail?.nomor_kamar || '').toLowerCase().includes(q)
  )
})

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPenyewa.value.length / perPage.value)))
const paginatedPenyewa = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredPenyewa.value.slice(start, start + perPage.value)
})
const paginationInfo = computed(() => {
  const total = filteredPenyewa.value.length
  if (total === 0) return 'Tidak ada data'
  const start = (currentPage.value - 1) * perPage.value + 1
  const end = Math.min(start + perPage.value - 1, total)
  return `Menampilkan ${start}-${end} dari ${total} penyewa`
})

function getExpireDate(masuk: string, durasi: number): string {
  return formatDateShort(addMonths(masuk, durasi))
}

// === MODAL HANDLERS ===
function openEditModal(penyewa: Penyewa) {
  selectedPenyewa.value = penyewa
  editForm.value = {
    nama_lengkap: penyewa.nama_lengkap,
    nomor_hp: penyewa.nomor_hp,
    durasi_sewa_bulan: penyewa.durasi_sewa_bulan
  }
  showEditModal.value = true
}

function openPaymentModal(penyewa: Penyewa) {
  selectedPenyewa.value = penyewa
  paymentForm.value = { jumlah: '', keterangan: `Pembayaran Kost ${penyewa.nama_lengkap}` }
  showPaymentModal.value = true
}

function openExtendModal(penyewa: Penyewa) {
  selectedPenyewa.value = penyewa
  extendForm.value = { tambahan_bulan: 1 }
  showExtendModal.value = true
}

function openCheckoutModal(penyewa: Penyewa) {
  selectedPenyewa.value = penyewa
  showCheckoutModal.value = true
}

// === SUBMIT HANDLERS ===
async function submitEdit() {
  if (!selectedPenyewa.value || !editForm.value.nama_lengkap || !editForm.value.nomor_hp) {
    toast.warning('Validasi', 'Nama dan nomor HP wajib diisi!')
    return
  }
  isSubmitting.value = true
  try {
    await penyewaStore.update(selectedPenyewa.value.id, {
      nama_lengkap: editForm.value.nama_lengkap,
      nomor_hp: editForm.value.nomor_hp,
      durasi_sewa_bulan: editForm.value.durasi_sewa_bulan
    })
    showEditModal.value = false
    toast.success('Berhasil', 'Data penyewa berhasil diperbarui!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal memperbarui data penyewa')
  } finally {
    isSubmitting.value = false
  }
}

async function submitPayment() {
  if (!selectedPenyewa.value || !paymentForm.value.jumlah) {
    toast.warning('Validasi', 'Jumlah pembayaran wajib diisi!')
    return
  }
  isSubmitting.value = true
  try {
    await keuanganStore.createPayment({
      penyewa: selectedPenyewa.value.id,
      jumlah: Number(paymentForm.value.jumlah),
      keterangan: paymentForm.value.keterangan
    })
    showPaymentModal.value = false
    toast.success('Berhasil', 'Pembayaran berhasil dicatat!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal mencatat pembayaran')
  } finally {
    isSubmitting.value = false
  }
}

async function submitExtend() {
  if (!selectedPenyewa.value) return
  isSubmitting.value = true
  try {
    const newDurasi = selectedPenyewa.value.durasi_sewa_bulan + extendForm.value.tambahan_bulan
    await penyewaStore.update(selectedPenyewa.value.id, { durasi_sewa_bulan: newDurasi })
    showExtendModal.value = false
    toast.success('Berhasil', `Sewa berhasil diperpanjang ${extendForm.value.tambahan_bulan} bulan!`)
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal memperpanjang sewa')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCheckout() {
  if (!selectedPenyewa.value) return
  isSubmitting.value = true
  try {
    await penyewaStore.remove(selectedPenyewa.value.id)
    await kamarStore.fetchAll()
    showCheckoutModal.value = false
    toast.success('Check-Out Berhasil', 'Penyewa telah keluar. Kamar sekarang kosong.')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal check out penyewa')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  penyewaStore.fetchAll()
})
</script>

<template>
  <div class="bg-white p-8 rounded-2xl shadow-sm">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div class="space-y-2 w-full md:w-2/3">
        <h2 class="text-2xl font-bold font-display text-slate-800">Data Penyewa Aktif</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Pencarian</label>
            <input v-model="search" type="text" placeholder="Cari nama/HP/kamar" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Per Halaman</label>
            <select v-model="perPage" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option :value="5">5</option><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border border-slate-200 rounded-xl">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Nama</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Nomor HP</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Kamar</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Masuk</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Durasi</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Habis</th>
            <th class="text-right px-4 py-3 text-sm font-semibold text-slate-600">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="penyewaStore.loading"><td colspan="7" class="text-center text-slate-400 py-6">Memuat data...</td></tr>
          <tr v-else-if="paginatedPenyewa.length === 0"><td colspan="7" class="text-center text-slate-400 py-6">Tidak ada penyewa.</td></tr>
          <tr v-else v-for="penyewa in paginatedPenyewa" :key="penyewa.id" class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-semibold text-slate-800">{{ penyewa.nama_lengkap }}</td>
            <td class="px-4 py-3 text-slate-600">{{ penyewa.nomor_hp }}</td>
            <td class="px-4 py-3 text-slate-600">{{ penyewa.kamar_detail?.nomor_kamar || '-' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ formatDateShort(penyewa.tanggal_masuk) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ penyewa.durasi_sewa_bulan }} Bulan</td>
            <td class="px-4 py-3 text-slate-600">{{ getExpireDate(penyewa.tanggal_masuk, penyewa.durasi_sewa_bulan) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <button @click="openEditModal(penyewa)" class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="openPaymentModal(penyewa)" class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Bayar">
                  <Wallet class="w-4 h-4" />
                </button>
                <button @click="openExtendModal(penyewa)" class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Perpanjang">
                  <CalendarPlus class="w-4 h-4" />
                </button>
                <button @click="openCheckoutModal(penyewa)" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Check Out">
                  <LogOut class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-4">
      <div class="text-sm text-slate-500">{{ paginationInfo }}</div>
      <div class="flex gap-1">
        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50">«</button>
        <span class="px-3 py-1 text-sm text-slate-600">{{ currentPage }}/{{ totalPages }}</span>
        <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50">»</button>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showEditModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Edit Penyewa</h3></div>
            <button @click="showEditModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nama Lengkap</label><input v-model="editForm.nama_lengkap" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Nomor HP</label><input v-model="editForm.nomor_hp" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Durasi (Bulan)</label><input v-model="editForm.durasi_sewa_bulan" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showEditModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitEdit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showPaymentModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-emerald-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Catat Pembayaran</h3><p class="text-sm opacity-80">{{ selectedPenyewa?.nama_lengkap }}</p></div>
            <button @click="showPaymentModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-slate-50 p-3 rounded-lg text-sm">
              <p><span class="text-slate-400">Kamar:</span> <strong>{{ selectedPenyewa?.kamar_detail?.nomor_kamar || '-' }}</strong></p>
              <p v-if="selectedPenyewa?.kamar_detail"><span class="text-slate-400">Harga:</span> <strong class="text-emerald-600">{{ formatRupiah(selectedPenyewa.kamar_detail.tipe_detail?.harga_per_bulan || 0) }}/bulan</strong></p>
            </div>
            <div><label class="text-sm text-slate-600 mb-1 block">Jumlah (Rp)</label><input v-model="paymentForm.jumlah" type="number" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Keterangan</label><textarea v-model="paymentForm.keterangan" class="w-full px-3 py-2 border border-slate-200 rounded-lg h-20 resize-none"></textarea></div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showPaymentModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitPayment" :disabled="isSubmitting" class="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Extend Modal -->
    <Teleport to="body">
      <div v-if="showExtendModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showExtendModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-blue-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Perpanjang Sewa</h3><p class="text-sm opacity-80">{{ selectedPenyewa?.nama_lengkap }}</p></div>
            <button @click="showExtendModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-slate-50 p-3 rounded-lg text-sm">
              <p><span class="text-slate-400">Durasi Saat Ini:</span> <strong>{{ selectedPenyewa?.durasi_sewa_bulan }} bulan</strong></p>
              <p><span class="text-slate-400">Habis:</span> <strong>{{ selectedPenyewa ? getExpireDate(selectedPenyewa.tanggal_masuk, selectedPenyewa.durasi_sewa_bulan) : '-' }}</strong></p>
            </div>
            <div><label class="text-sm text-slate-600 mb-1 block">Tambah Berapa Bulan?</label><input v-model="extendForm.tambahan_bulan" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p>Durasi baru: <strong>{{ (selectedPenyewa?.durasi_sewa_bulan || 0) + extendForm.tambahan_bulan }} bulan</strong></p>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showExtendModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitExtend" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Perpanjang' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Checkout Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showCheckoutModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCheckoutModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="bg-rose-600 p-6 text-white">
            <h3 class="font-bold text-lg">Check Out Penyewa?</h3>
          </div>
          <div class="p-6 text-center">
            <p class="text-slate-600">Yakin ingin mengeluarkan <strong>{{ selectedPenyewa?.nama_lengkap }}</strong>?</p>
            <p class="text-sm text-slate-400 mt-2">Kamar {{ selectedPenyewa?.kamar_detail?.nomor_kamar || '' }} akan menjadi kosong dan tersedia.</p>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showCheckoutModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitCheckout" :disabled="isSubmitting" class="px-4 py-2 bg-rose-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Memproses...' : 'Ya, Check Out' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </div>
</template>
