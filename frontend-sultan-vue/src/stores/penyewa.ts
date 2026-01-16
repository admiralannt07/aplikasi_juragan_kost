import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { Kamar } from './kamar'

export interface Penyewa {
  id: number
  nama_lengkap: string
  nomor_hp: string
  tanggal_masuk: string
  durasi_sewa_bulan: number
  kamar: number
  kamar_detail: Kamar | null
}

export const usePenyewaStore = defineStore('penyewa', () => {
  const items = ref<Penyewa[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('penyewa/')
      items.value = res.data.results || res.data
    } catch (e) {
      error.value = 'Gagal memuat data penyewa'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Partial<Penyewa>) {
    const res = await api.post('penyewa/', payload)
    await fetchAll()
    return res.data
  }

  async function update(id: number, payload: Partial<Penyewa>) {
    const res = await api.patch(`penyewa/${id}/`, payload)
    await fetchAll()
    return res.data
  }

  async function remove(id: number) {
    await api.delete(`penyewa/${id}/`)
    await fetchAll()
  }

  async function getByKamar(kamarId: number): Promise<Penyewa | null> {
    try {
      const res = await api.get(`penyewa/?kamar=${kamarId}`)
      const data = res.data.results || res.data
      return data[0] || null
    } catch {
      return null
    }
  }

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    getByKamar
  }
})
