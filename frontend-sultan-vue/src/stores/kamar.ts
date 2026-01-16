import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface TipeKamar {
  id: number
  nama_tipe: string
  harga_per_bulan: number
  fasilitas?: string
}

export interface Kamar {
  id: number
  nomor_kamar: string
  lantai: number
  status: 'KOSONG' | 'ISI' | 'MAINTENANCE'
  tipe: number
  tipe_detail: TipeKamar
}

export const useKamarStore = defineStore('kamar', () => {
  const items = ref<Kamar[]>([])
  const tipeKamarList = ref<TipeKamar[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalKamar = computed(() => items.value.length)
  const totalTerisi = computed(() => items.value.filter(k => k.status === 'ISI').length)
  const totalKosong = computed(() => items.value.filter(k => k.status === 'KOSONG').length)

  // === KAMAR ACTIONS ===
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('kamar/')
      items.value = res.data.results || res.data
    } catch (e) {
      error.value = 'Gagal memuat data kamar'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Partial<Kamar>) {
    const res = await api.post('kamar/', payload)
    await fetchAll()
    return res.data
  }

  async function update(id: number, payload: Partial<Kamar>) {
    const res = await api.patch(`kamar/${id}/`, payload)
    await fetchAll()
    return res.data
  }

  async function remove(id: number) {
    await api.delete(`kamar/${id}/`)
    await fetchAll()
  }

  // === TIPE KAMAR ACTIONS ===
  async function fetchTipeKamar() {
    try {
      const res = await api.get('tipe-kamar/')
      tipeKamarList.value = res.data.results || res.data
    } catch (e) {
      console.error('Gagal memuat tipe kamar', e)
    }
  }

  async function createTipeKamar(payload: { nama_tipe: string; harga_per_bulan: number; fasilitas?: string }) {
    const res = await api.post('tipe-kamar/', payload)
    await fetchTipeKamar()
    return res.data
  }

  async function updateTipeKamar(id: number, payload: Partial<TipeKamar>) {
    const res = await api.patch(`tipe-kamar/${id}/`, payload)
    await fetchTipeKamar()
    return res.data
  }

  async function removeTipeKamar(id: number) {
    await api.delete(`tipe-kamar/${id}/`)
    await fetchTipeKamar()
  }

  return {
    items,
    tipeKamarList,
    loading,
    error,
    totalKamar,
    totalTerisi,
    totalKosong,
    fetchAll,
    create,
    update,
    remove,
    fetchTipeKamar,
    createTipeKamar,
    updateTipeKamar,
    removeTipeKamar
  }
})
