import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface Transaksi {
  id: number
  penyewa: number
  penyewa_detail?: { nama_lengkap: string }
  jumlah: string | number
  keterangan: string
  tanggal_bayar: string
}

export interface FinancialSummary {
  total_pendapatan: number
  pendapatan_bulan_ini: number
  recent_transactions: Array<{
    penyewa: string
    jumlah: number
    keterangan: string
    tanggal: string
  }>
  grafik: {
    labels: string[]
    data: number[]
  }
}

export const useKeuanganStore = defineStore('keuangan', () => {
  const riwayat = ref<Transaksi[]>([])
  const summary = ref<FinancialSummary | null>(null)
  const loading = ref(false)

  const totalPendapatan = computed(() => 
    riwayat.value.reduce((acc, t) => acc + parseFloat(String(t.jumlah)), 0)
  )

  const pendapatanBulanIni = computed(() => {
    const now = new Date()
    return riwayat.value
      .filter(t => {
        const d = new Date(t.tanggal_bayar)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((acc, t) => acc + parseFloat(String(t.jumlah)), 0)
  })

  async function fetchRiwayat() {
    loading.value = true
    try {
      const res = await api.get('riwayat-bayar/')
      riwayat.value = res.data.results || res.data
    } catch (e) {
      console.error('Gagal memuat riwayat', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    try {
      const res = await api.get('financial-summary/')
      summary.value = res.data
    } catch (e) {
      console.error('Gagal memuat summary keuangan', e)
    }
  }

  async function createPayment(payload: { penyewa: number; jumlah: number; keterangan: string }) {
    const res = await api.post('riwayat-bayar/', payload)
    await fetchRiwayat()
    await fetchSummary()
    return res.data
  }

  return {
    riwayat,
    summary,
    loading,
    totalPendapatan,
    pendapatanBulanIni,
    fetchRiwayat,
    fetchSummary,
    createPayment
  }
})
