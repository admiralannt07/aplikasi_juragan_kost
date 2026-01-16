<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { motion } from 'motion-v'
import { Plus, Pencil, Trash2, X } from 'lucide-vue-next'
import { useKamarStore, type Kamar } from '@/stores/kamar'
import { formatRupiah } from '@/services/utils'

const kamarStore = useKamarStore()

// Table state
const search = ref('')
const statusFilter = ref('ALL')
const perPage = ref(10)
const currentPage = ref(1)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedKamar = ref<Kamar | null>(null)
const isSubmitting = ref(false)

// Form states
const addForm = ref({ nomor_kamar: '', lantai: 1, tipe: '', status: 'KOSONG' })
const editForm = ref({ nomor_kamar: '', lantai: 1, tipe: '', status: 'KOSONG' })

// Filtered data
const filteredKamar = computed(() => {
  let data = [...kamarStore.items]
  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(k => k.nomor_kamar.toLowerCase().includes(q) || k.tipe_detail.nama_tipe.toLowerCase().includes(q) || k.status.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'ALL') {
    data = data.filter(k => k.status === statusFilter.value)
  }
  return data
})

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredKamar.value.length / perPage.value)))
const paginatedKamar = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredKamar.value.slice(start, start + perPage.value)
})
const paginationInfo = computed(() => {
  const total = filteredKamar.value.length
  if (total === 0) return 'Tidak ada data'
  const start = (currentPage.value - 1) * perPage.value + 1
  const end = Math.min(start + perPage.value - 1, total)
  return `Menampilkan ${start}-${end} dari ${total} kamar`
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'KOSONG': return 'bg-emerald-100 text-emerald-700'
    case 'ISI': return 'bg-rose-100 text-rose-700'
    default: return 'bg-amber-100 text-amber-700'
  }
}

// === MODAL HANDLERS ===
function openAddModal() {
  addForm.value = { nomor_kamar: '', lantai: 1, tipe: '', status: 'KOSONG' }
  if (kamarStore.tipeKamarList.length === 0) kamarStore.fetchTipeKamar()
  showAddModal.value = true
}

function openEditModal(kamar: Kamar) {
  selectedKamar.value = kamar
  editForm.value = {
    nomor_kamar: kamar.nomor_kamar,
    lantai: kamar.lantai,
    tipe: String(kamar.tipe),
    status: kamar.status
  }
  if (kamarStore.tipeKamarList.length === 0) kamarStore.fetchTipeKamar()
  showEditModal.value = true
}

function openDeleteModal(kamar: Kamar) {
  selectedKamar.value = kamar
  showDeleteModal.value = true
}

// === SUBMIT HANDLERS ===
async function submitAdd() {
  if (!addForm.value.nomor_kamar || !addForm.value.tipe) {
    alert('Nomor kamar dan tipe wajib diisi!')
    return
  }
  isSubmitting.value = true
  try {
    await kamarStore.create({
      nomor_kamar: addForm.value.nomor_kamar,
      lantai: addForm.value.lantai,
      tipe: Number(addForm.value.tipe),
      status: addForm.value.status as 'KOSONG' | 'ISI' | 'MAINTENANCE'
    })
    showAddModal.value = false
    alert('Kamar berhasil ditambahkan!')
  } catch (e) {
    console.error(e)
    alert('Gagal menambah kamar')
  } finally {
    isSubmitting.value = false
  }
}

async function submitEdit() {
  if (!selectedKamar.value) return
  isSubmitting.value = true
  try {
    await kamarStore.update(selectedKamar.value.id, {
      nomor_kamar: editForm.value.nomor_kamar,
      lantai: editForm.value.lantai,
      tipe: Number(editForm.value.tipe),
      status: editForm.value.status as 'KOSONG' | 'ISI' | 'MAINTENANCE'
    })
    showEditModal.value = false
    alert('Kamar berhasil diperbarui!')
  } catch (e) {
    console.error(e)
    alert('Gagal memperbarui kamar')
  } finally {
    isSubmitting.value = false
  }
}

async function submitDelete() {
  if (!selectedKamar.value) return
  isSubmitting.value = true
  try {
    await kamarStore.remove(selectedKamar.value.id)
    showDeleteModal.value = false
    alert('Kamar berhasil dihapus!')
  } catch (e) {
    console.error(e)
    alert('Gagal menghapus kamar')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  kamarStore.fetchAll()
})
</script>

<template>
  <div class="bg-white p-8 rounded-2xl shadow-sm">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div class="space-y-2 w-full md:w-2/3">
        <h2 class="text-2xl font-bold font-display text-slate-800">Master Data Kamar</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Pencarian</label>
            <input v-model="search" type="text" placeholder="Cari nomor/tipe/status" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Status</label>
            <select v-model="statusFilter" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">Semua</option>
              <option value="KOSONG">Kosong</option>
              <option value="ISI">Terisi</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Per Halaman</label>
            <select v-model="perPage" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option :value="5">5</option><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
      <motion.button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-colors" :whileHover="{ scale: 1.02 }" :whileTap="{ scale: 0.98 }">
        <Plus class="w-4 h-4" />
        Tambah Kamar
      </motion.button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border border-slate-200 rounded-xl">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Nomor</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Lantai</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Tipe</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
            <th class="text-left px-4 py-3 text-sm font-semibold text-slate-600">Harga/Bulan</th>
            <th class="text-right px-4 py-3 text-sm font-semibold text-slate-600">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="kamarStore.loading"><td colspan="6" class="text-center text-slate-400 py-6">Memuat data...</td></tr>
          <tr v-else-if="paginatedKamar.length === 0"><td colspan="6" class="text-center text-slate-400 py-6">Tidak ada data.</td></tr>
          <tr v-else v-for="kamar in paginatedKamar" :key="kamar.id" class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-semibold text-slate-800">{{ kamar.nomor_kamar }}</td>
            <td class="px-4 py-3 text-slate-600">{{ kamar.lantai }}</td>
            <td class="px-4 py-3 text-slate-600">{{ kamar.tipe_detail.nama_tipe }}</td>
            <td class="px-4 py-3">
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusBadge(kamar.status)]">
                {{ kamar.status === 'KOSONG' ? 'Kosong' : kamar.status === 'ISI' ? 'Terisi' : 'Maintenance' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ formatRupiah(kamar.tipe_detail.harga_per_bulan) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button @click="openEditModal(kamar)" class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="openDeleteModal(kamar)" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                  <Trash2 class="w-4 h-4" />
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

    <!-- Add Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showAddModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Tambah Kamar Baru</h3></div>
            <button @click="showAddModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nomor Kamar</label><input v-model="addForm.nomor_kamar" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Lantai</label><input v-model="addForm.lantai" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Tipe Kamar</label>
              <select v-model="addForm.tipe" class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <option value="" disabled>Pilih tipe</option>
                <option v-for="t in kamarStore.tipeKamarList" :key="t.id" :value="t.id">{{ t.nama_tipe }} - {{ formatRupiah(t.harga_per_bulan) }}</option>
              </select>
            </div>
            <div><label class="text-sm text-slate-600 mb-1 block">Status</label>
              <select v-model="addForm.status" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
                <option value="KOSONG">KOSONG</option><option value="ISI">ISI</option><option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showAddModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitAdd" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showEditModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div><h3 class="font-bold text-lg">Edit Kamar {{ selectedKamar?.nomor_kamar }}</h3></div>
            <button @click="showEditModal = false" class="p-1 hover:bg-white/20 rounded-lg"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div><label class="text-sm text-slate-600 mb-1 block">Nomor Kamar</label><input v-model="editForm.nomor_kamar" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Lantai</label><input v-model="editForm.lantai" type="number" min="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg" /></div>
            <div><label class="text-sm text-slate-600 mb-1 block">Tipe Kamar</label>
              <select v-model="editForm.tipe" class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <option value="" disabled>Pilih tipe</option>
                <option v-for="t in kamarStore.tipeKamarList" :key="t.id" :value="t.id">{{ t.nama_tipe }} - {{ formatRupiah(t.harga_per_bulan) }}</option>
              </select>
            </div>
            <div><label class="text-sm text-slate-600 mb-1 block">Status</label>
              <select v-model="editForm.status" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
                <option value="KOSONG">KOSONG</option><option value="ISI">ISI</option><option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showEditModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitEdit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menyimpan...' : 'Perbarui' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteModal = false"></div>
        <motion.div :initial="{ opacity: 0, scale: 0.95 }" :animate="{ opacity: 1, scale: 1 }" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="bg-rose-600 p-6 text-white">
            <h3 class="font-bold text-lg">Hapus Kamar?</h3>
          </div>
          <div class="p-6 text-center">
            <p class="text-slate-600">Yakin ingin menghapus kamar <strong>{{ selectedKamar?.nomor_kamar }}</strong>?</p>
            <p class="text-sm text-slate-400 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showDeleteModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="submitDelete" :disabled="isSubmitting" class="px-4 py-2 bg-rose-600 text-white rounded-lg disabled:opacity-50">{{ isSubmitting ? 'Menghapus...' : 'Ya, Hapus' }}</button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </div>
</template>
