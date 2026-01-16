<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { motion } from 'motion-v'
import { User, Mail, Calendar, Shield, Key, Save, X, Camera } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

// State
const isEditing = ref(false)
const isSaving = ref(false)
const showPasswordModal = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Form data
const profileForm = ref({
  first_name: '',
  last_name: '',
  email: ''
})

const passwordForm = ref({
  old_password: '',
  new_password1: '',
  new_password2: ''
})

// Initialize form with current user data
onMounted(() => {
  if (authStore.user) {
    profileForm.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || ''
    }
  }
})

function startEditing() {
  isEditing.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function cancelEditing() {
  isEditing.value = false
  if (authStore.user) {
    profileForm.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || ''
    }
  }
}

async function saveProfile() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.patch('auth/user/', {
      first_name: profileForm.value.first_name,
      last_name: profileForm.value.last_name
    })
    
    await authStore.fetchUser()
    isEditing.value = false
    successMessage.value = 'Profil berhasil diperbarui!'
    
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch {
    errorMessage.value = 'Gagal menyimpan profil'
  } finally {
    isSaving.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.new_password1 !== passwordForm.value.new_password2) {
    errorMessage.value = 'Password baru tidak cocok!'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await api.post('auth/password/change/', {
      old_password: passwordForm.value.old_password,
      new_password1: passwordForm.value.new_password1,
      new_password2: passwordForm.value.new_password2
    })
    
    showPasswordModal.value = false
    passwordForm.value = { old_password: '', new_password1: '', new_password2: '' }
    successMessage.value = 'Password berhasil diubah!'
    
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: Record<string, string[]> } }
    const data = err.response?.data
    if (data) {
      const firstError = Object.values(data)[0]
      errorMessage.value = Array.isArray(firstError) ? (firstError[0] ?? 'Gagal mengubah password') : String(firstError)
    } else {
      errorMessage.value = 'Gagal mengubah password'
    }
  } finally {
    isSaving.value = false
  }
}

function getInitials(): string {
  if (!authStore.user) return '?'
  const first = authStore.user.first_name?.[0] || authStore.user.username?.[0] || ''
  const last = authStore.user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.3 }"
    >
      <h1 class="text-2xl font-bold font-display text-slate-800">Pengaturan Profil</h1>
      <p class="text-slate-500 mt-1">Kelola informasi akun dan keamanan Anda</p>
    </motion.div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
      {{ errorMessage }}
    </div>

    <!-- Profile Card -->
    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.3, delay: 0.1 }"
      class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <!-- Avatar Section -->
      <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-10">
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {{ getInitials() }}
            </div>
            <button class="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <Camera class="w-4 h-4" />
            </button>
          </div>
          <div class="text-white">
            <h2 class="text-2xl font-bold">{{ authStore.user?.first_name || authStore.user?.username || 'Juragan' }} {{ authStore.user?.last_name || '' }}</h2>
            <p class="text-indigo-200 flex items-center gap-2 mt-1">
              <Mail class="w-4 h-4" />
              {{ authStore.user?.email || 'No email' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="p-8">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <User class="w-5 h-5 text-indigo-600" />
            Informasi Pribadi
          </h3>
          <button
            v-if="!isEditing"
            @click="startEditing"
            class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            Edit Profil
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Username (readonly) -->
          <div>
            <label class="text-sm text-slate-500 mb-1.5 block">Username</label>
            <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
              <User class="w-5 h-5 text-slate-400" />
              <span class="text-slate-700 font-medium">{{ authStore.user?.username }}</span>
            </div>
          </div>

          <!-- Email (readonly) -->
          <div>
            <label class="text-sm text-slate-500 mb-1.5 block">Email</label>
            <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
              <Mail class="w-5 h-5 text-slate-400" />
              <span class="text-slate-700">{{ authStore.user?.email }}</span>
            </div>
          </div>

          <!-- First Name -->
          <div>
            <label class="text-sm text-slate-500 mb-1.5 block">Nama Depan</label>
            <input
              v-model="profileForm.first_name"
              :disabled="!isEditing"
              type="text"
              placeholder="Nama depan"
              class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="text-sm text-slate-500 mb-1.5 block">Nama Belakang</label>
            <input
              v-model="profileForm.last_name"
              :disabled="!isEditing"
              type="text"
              placeholder="Nama belakang"
              class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <!-- Edit Actions -->
        <div v-if="isEditing" class="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
          <button
            @click="cancelEditing"
            class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            @click="saveProfile"
            :disabled="isSaving"
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </motion.div>

    <!-- Security Section -->
    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.3, delay: 0.2 }"
      class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8"
    >
      <h3 class="font-semibold text-lg text-slate-800 flex items-center gap-2 mb-6">
        <Shield class="w-5 h-5 text-indigo-600" />
        Keamanan Akun
      </h3>

      <div class="space-y-4">
        <!-- Change Password -->
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Key class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-medium text-slate-800">Password</h4>
              <p class="text-sm text-slate-500">Ubah password akun Anda</p>
            </div>
          </div>
          <button
            @click="showPasswordModal = true"
            class="px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            Ubah Password
          </button>
        </div>

        <!-- Account Created Info -->
        <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-medium text-slate-800">Status Akun</h4>
            <p class="text-sm text-emerald-600">Akun aktif dan terverifikasi</p>
          </div>
        </div>
      </div>
    </motion.div>

    <!-- Change Password Modal -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showPasswordModal = false"></div>
        <motion.div
          :initial="{ opacity: 0, scale: 0.95 }"
          :animate="{ opacity: 1, scale: 1 }"
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div>
              <h3 class="font-bold text-lg">Ubah Password</h3>
              <p class="text-sm opacity-80">Masukkan password lama dan baru</p>
            </div>
            <button @click="showPasswordModal = false" class="p-1 hover:bg-white/20 rounded-lg">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Password Lama</label>
              <input v-model="passwordForm.old_password" type="password" class="w-full px-4 py-3 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Password Baru</label>
              <input v-model="passwordForm.new_password1" type="password" class="w-full px-4 py-3 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-sm text-slate-600 mb-1 block">Konfirmasi Password Baru</label>
              <input v-model="passwordForm.new_password2" type="password" class="w-full px-4 py-3 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <button @click="showPasswordModal = false" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
            <button @click="changePassword" :disabled="isSaving" class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
              {{ isSaving ? 'Menyimpan...' : 'Simpan Password' }}
            </button>
          </div>
        </motion.div>
      </div>
    </Teleport>
  </div>
</template>
