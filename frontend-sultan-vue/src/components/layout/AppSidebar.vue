<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { LayoutDashboard, DoorClosed, Users, Wallet, Settings, LogOut, X, AlertTriangle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Logout modal state
const showLogoutModal = ref(false)
const isLoggingOut = ref(false)

const menuItems = [
  { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'kamar', path: '/kamar', icon: DoorClosed, label: 'Data Kamar' },
  { id: 'penyewa', path: '/penyewa', icon: Users, label: 'Penyewa' },
  { id: 'keuangan', path: '/keuangan', icon: Wallet, label: 'Keuangan' },
  { id: 'profile', path: '/profile', icon: Settings, label: 'Pengaturan' }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function openLogoutModal() {
  showLogoutModal.value = true
}

function closeLogoutModal() {
  showLogoutModal.value = false
}

async function handleLogout() {
  isLoggingOut.value = true
  await authStore.logout()
  isLoggingOut.value = false
  showLogoutModal.value = false
  router.push('/login')
}
</script>

<template>
  <aside class="w-64 bg-sultan-dark text-white flex flex-col shadow-2xl z-20">
    <!-- Logo -->
    <div class="p-6 border-b border-slate-700">
      <h1 class="font-display text-3xl font-bold tracking-wider text-center">
        SULTAN<span class="text-sultan-gold">.</span>
      </h1>
      <p class="text-xs text-slate-400 text-center mt-1 tracking-widest">ESTATE MANAGEMENT</p>
    </div>

    <!-- User Info -->
    <div v-if="authStore.user" class="px-4 py-4 border-b border-slate-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold">
          {{ authStore.displayName.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">{{ authStore.displayName }}</p>
          <p class="text-xs text-slate-400 truncate">{{ authStore.user.email }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <div class="text-slate-300">
        <p class="text-slate-500 text-xs font-bold uppercase mb-3 px-2">Main Menu</p>
        
        <motion.a
          v-for="item in menuItems"
          :key="item.id"
          :href="item.path"
          @click.prevent="router.push(item.path)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors',
            isActive(item.path)
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white'
          ]"
          :whileHover="{ scale: 1.02 }"
          :whileTap="{ scale: 0.98 }"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </motion.a>
      </div>
    </nav>

    <!-- Logout Button -->
    <div class="p-4 border-t border-slate-700">
      <motion.button
        @click="openLogoutModal"
        class="flex items-center justify-center gap-2 w-full px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
        :whileHover="{ scale: 1.02 }"
        :whileTap="{ scale: 0.98 }"
      >
        <LogOut class="w-4 h-4" />
        <span>Logout</span>
      </motion.button>
    </div>

    <!-- Logout Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeLogoutModal"></div>
        
        <!-- Modal -->
        <motion.div
          :initial="{ opacity: 0, scale: 0.9, y: 20 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :transition="{ duration: 0.2, ease: 'easeOut' }"
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-rose-500 to-rose-600 p-6 text-white">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-lg">Konfirmasi Logout</h3>
                <p class="text-sm opacity-80">Anda akan keluar dari sistem</p>
              </div>
            </div>
            <button 
              @click="closeLogoutModal" 
              class="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6 text-center">
            <p class="text-slate-600 mb-2">
              Apakah Anda yakin ingin keluar, <strong class="text-slate-800">Juragan</strong>?
            </p>
            <p class="text-sm text-slate-400">
              Anda perlu login kembali untuk mengakses dashboard.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="flex gap-3 p-6 pt-0">
            <button
              @click="closeLogoutModal"
              class="flex-1 px-4 py-3 border border-slate-300 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleLogout"
              :disabled="isLoggingOut"
              class="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="isLoggingOut" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <LogOut v-else class="w-4 h-4" />
              {{ isLoggingOut ? 'Keluar...' : 'Ya, Logout' }}
            </button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </aside>
</template>
