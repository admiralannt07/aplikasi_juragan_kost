<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { motion } from 'motion-v'
import { CalendarDays, WalletCards, PlusCircle, ArrowDown, X } from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { useKeuanganStore } from '@/stores/keuangan'
import { usePenyewaStore } from '@/stores/penyewa'
import { useToastStore } from '@/stores/toast'
import { formatRupiah } from '@/services/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const keuanganStore = useKeuanganStore()
const penyewaStore = usePenyewaStore()
const toast = useToastStore()

// Modal state
const showPaymentModal = ref(false)
const paymentForm = ref({
  penyewa: '',
  jumlah: '',
  keterangan: ''
})
const isSubmitting = ref(false)

// Chart config
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { display: false } },
    x: { grid: { display: false } }
  }
}

function openPaymentModal() {
  paymentForm.value = { penyewa: '', jumlah: '', keterangan: '' }
  showPaymentModal.value = true
  if (penyewaStore.items.length === 0) {
    penyewaStore.fetchAll()
  }
}

function closePaymentModal() {
  showPaymentModal.value = false
}

async function submitPayment() {
  if (!paymentForm.value.penyewa || !paymentForm.value.jumlah) {
    toast.warning('Validasi', 'Pilih penyewa dan masukkan jumlah!')
    return
  }
  
  isSubmitting.value = true
  try {
    await keuanganStore.createPayment({
      penyewa: Number(paymentForm.value.penyewa),
      jumlah: Number(paymentForm.value.jumlah),
      keterangan: paymentForm.value.keterangan
    })
    closePaymentModal()
    toast.success('Berhasil', 'Pembayaran berhasil disimpan!')
  } catch (e) {
    console.error(e)
    toast.error('Gagal', 'Gagal menyimpan pembayaran')
  } finally {
    isSubmitting.value = false
  }
}

// Helper to get penyewa name from transaction
function getPenyewaName(tx: { penyewa?: string | number; penyewa_detail?: { nama_lengkap?: string }; penyewa_nama?: string }) {
  // Try different possible field names from API
  if (tx.penyewa_detail?.nama_lengkap) return tx.penyewa_detail.nama_lengkap
  if (typeof tx.penyewa === 'string' && isNaN(Number(tx.penyewa))) return tx.penyewa
  if (tx.penyewa_nama) return tx.penyewa_nama
  return 'Penyewa'
}

onMounted(() => {
  keuanganStore.fetchRiwayat()
  keuanganStore.fetchSummary()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold font-display text-slate-800">Laporan Keuangan</h2>
        <p class="text-xs text-slate-500">Pantau arus kas masuk dari penyewa.</p>
      </div>
      <motion.button
        @click="openPaymentModal"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 transition-colors"
        :whileHover="{ scale: 1.02 }"
        :whileTap="{ scale: 0.98 }"
      >
        <PlusCircle class="w-4 h-4" />
        Catat Pemasukan
      </motion.button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3 }"
        class="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pendapatan Bulan Ini</p>
            <h3 class="font-display text-3xl font-bold text-slate-800">
              {{ formatRupiah(keuanganStore.summary?.pendapatan_bulan_ini || keuanganStore.pendapatanBulanIni) }}
            </h3>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CalendarDays class="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3, delay: 0.1 }"
        class="bg-white shadow-sm border border-slate-100 p-6 rounded-2xl"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pendapatan</p>
            <h3 class="font-display text-3xl font-bold text-slate-800">
              {{ formatRupiah(keuanganStore.summary?.total_pendapatan || keuanganStore.totalPendapatan) }}
            </h3>
          </div>
          <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <WalletCards class="w-6 h-6" />
          </div>
        </div>
      </motion.div>
    </div>

    <!-- Chart + Transaction List -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Chart -->
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3, delay: 0.2 }"
        class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <h3 class="font-bold text-lg text-slate-800 mb-4">Grafik Pendapatan</h3>
        <div class="relative h-80 w-full">
          <Bar
            v-if="keuanganStore.summary?.grafik"
            :data="{
              labels: keuanganStore.summary.grafik.labels,
              datasets: [{
                label: 'Pendapatan (Rp)',
                data: keuanganStore.summary.grafik.data,
                backgroundColor: '#4f46e5',
                borderRadius: 6
              }]
            }"
            :options="chartOptions"
          />
          <div v-else class="flex items-center justify-center h-full text-slate-400">
            Memuat grafik...
          </div>
        </div>
      </motion.div>

      <!-- Transaction List -->
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3, delay: 0.3 }"
        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full"
      >
        <h3 class="font-bold text-lg text-slate-800 mb-4">Riwayat Transaksi</h3>
        <div class="overflow-y-auto flex-1 pr-2 space-y-3">
          <div v-if="keuanganStore.riwayat.length === 0" class="text-center text-slate-400 py-8 text-sm">
            Belum ada data transaksi.
          </div>
          <div
            v-else
            v-for="tx in keuanganStore.riwayat.slice(0, 10)"
            :key="tx.id"
            class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ArrowDown class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">{{ getPenyewaName(tx) }}</p>
                <p class="text-xs text-slate-500">{{ tx.keterangan || 'Pembayaran Kost' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-emerald-600">+ {{ formatRupiah(tx.jumlah) }}</p>
              <p class="text-xs text-slate-400">{{ new Date(tx.tanggal_bayar).toLocaleDateString('id-ID') }}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="closePaymentModal"></div>
        
        <!-- Modal -->
        <motion.div
          :initial="{ opacity: 0, scale: 0.95 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.2 }"
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <!-- Header -->
          <div class="bg-emerald-600 p-6 text-white">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg font-display">Input Pembayaran</h3>
                <p class="text-sm opacity-80">Catat uang masuk dari penyewa</p>
              </div>
              <button @click="closePaymentModal" class="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <!-- Form -->
          <div class="p-6 space-y-4">
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Pilih Penyewa</label>
              <select
                v-model="paymentForm.penyewa"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>-- Pilih Penyewa --</option>
                <option v-for="p in penyewaStore.items" :key="p.id" :value="p.id">
                  {{ p.nama_lengkap }} {{ p.kamar_detail ? `(Kamar ${p.kamar_detail.nomor_kamar})` : '' }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Jumlah Bayar (Rp)</label>
              <input
                v-model="paymentForm.jumlah"
                type="number"
                placeholder="Contoh: 1500000"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Keterangan</label>
              <textarea
                v-model="paymentForm.keterangan"
                placeholder="Contoh: Bayar Kost Bulan Maret 2025"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button
              @click="closePaymentModal"
              class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              @click="submitPayment"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran' }}
            </button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </div>
</template>
