<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDateLong } from '@/services/utils'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Overview', subtitle: `Halo ${authStore.displayName || 'Juragan'}, pantau asetmu hari ini.` },
    '/kamar': { title: 'Master Data Kamar', subtitle: 'Kelola unit kamar properti.' },
    '/penyewa': { title: 'Data Penyewa', subtitle: 'Kelola penyewa aktif.' },
    '/keuangan': { title: 'Laporan Keuangan', subtitle: 'Pantau arus kas masuk dari penyewa.' },
    '/profile': { title: 'Pengaturan Profil', subtitle: 'Kelola akun dan keamanan.' }
  }
  return titles[route.path] || { title: 'Dashboard', subtitle: '' }
})

const todayDate = computed(() => formatDateLong())

const userInitial = computed(() => {
  if (!authStore.user) return '?'
  const first = authStore.user.first_name?.[0] || authStore.user.username?.[0] || ''
  return first.toUpperCase() || '?'
})

function goToProfile() {
  router.push('/profile')
}
</script>

<template>
  <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
    <div>
      <h2 class="font-display text-2xl font-bold text-slate-800">{{ pageTitle.title }}</h2>
      <p class="text-xs text-slate-500">{{ pageTitle.subtitle }}</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="px-3 py-1.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg">
        {{ todayDate }}
      </div>
      <button 
        @click="goToProfile"
        class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center ring ring-offset-2 ring-indigo-100 hover:bg-indigo-700 transition-colors cursor-pointer"
        :title="authStore.user?.username || 'Profile'"
      >
        <span class="text-lg font-bold">{{ userInitial }}</span>
      </button>
    </div>
  </header>
</template>
