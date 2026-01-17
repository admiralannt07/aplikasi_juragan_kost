<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { motion } from 'motion-v'
import { Lock, User, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form state
const loginIdentifier = ref('')  // Can be username or email
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

// UI state
const isLoading = ref(false)
const error = ref('')
const socialLoading = ref<'google' | 'facebook' | null>(null)

// Check for OAuth callback errors
onMounted(() => {
  const errorParam = route.query.error as string
  if (errorParam) {
    error.value = decodeURIComponent(errorParam)
  }
})

async function handleLogin() {
  if (!loginIdentifier.value || !password.value) {
    error.value = 'Masukkan username/email dan password!'
    return
  }

  isLoading.value = true
  error.value = ''

  // Determine if input is email or username
  const isEmail = loginIdentifier.value.includes('@')
  const credentials = isEmail 
    ? { email: loginIdentifier.value, password: password.value }
    : { username: loginIdentifier.value, password: password.value }

  const result = await authStore.login(credentials)

  isLoading.value = false

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || 'Login gagal!'
  }
}

function handleSocialLogin(provider: 'google' | 'facebook') {
  socialLoading.value = provider
  authStore.socialLogin(provider)
}
</script>

<template>
  <div class="min-h-screen bg-sultan-bg flex">
    <!-- Left Panel - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-sultan-dark relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-20 w-64 h-64 bg-sultan-gold rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-80 h-80 bg-indigo-600 rounded-full blur-3xl"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
        <motion.div
          :initial="{ opacity: 0, y: 30 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
          class="text-center"
        >
          <!-- Logo -->
          <div class="mb-8">
            <img src="/logo.png" alt="Sultan Logo" class="w-30 h-30 mx-auto" />
            <h1 class="font-display text-5xl font-bold tracking-wider">
              SULTAN<span class="text-sultan-gold">.</span>
            </h1>
            <p class="text-slate-400 tracking-widest text-sm mt-2">ESTATE MANAGEMENT SYSTEM</p>
          </div>
          
          <!-- Features -->
          <div class="space-y-6 mt-12 text-left max-w-sm">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-white">Kelola Properti Mudah</h3>
                <p class="text-slate-400 text-sm">Pantau semua unit kamar dalam satu dashboard</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-white">Laporan Keuangan Otomatis</h3>
                <p class="text-slate-400 text-sm">Grafik pendapatan real-time dan riwayat transaksi</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-sultan-gold/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-sultan-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-white">Manajemen Penyewa</h3>
                <p class="text-slate-400 text-sm">Check-in, check-out, dan perpanjangan sewa</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <motion.div
        :initial="{ opacity: 0, x: 30 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.5 }"
        class="w-full max-w-md"
      >
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <h1 class="font-display text-3xl font-bold text-sultan-dark">
            SULTAN<span class="text-sultan-gold">.</span>
          </h1>
          <p class="text-slate-400 text-xs tracking-widest">ESTATE MANAGEMENT</p>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-slate-800 font-display">Selamat Datang, Juragan!</h2>
            <p class="text-slate-500 text-sm mt-2">Masuk untuk mengelola properti Anda</p>
          </div>

          <!-- Social Login Buttons -->
          <div class="space-y-3 mb-6">
            <motion.button
              @click="handleSocialLogin('google')"
              :disabled="!!socialLoading"
              class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              :whileHover="{ scale: 1.01 }"
              :whileTap="{ scale: 0.99 }"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="text-slate-700 font-medium">
                {{ socialLoading === 'google' ? 'Menghubungkan...' : 'Masuk dengan Google' }}
              </span>
            </motion.button>

            <motion.button
              @click="handleSocialLogin('facebook')"
              :disabled="!!socialLoading"
              class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-colors disabled:opacity-50"
              :whileHover="{ scale: 1.01 }"
              :whileTap="{ scale: 0.99 }"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span class="font-medium">
                {{ socialLoading === 'facebook' ? 'Menghubungkan...' : 'Masuk dengan Facebook' }}
              </span>
            </motion.button>
          </div>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-400">atau masuk dengan akun</span>
            </div>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Username/Email Field -->
            <div>
              <label class="text-sm text-slate-600 mb-1.5 block font-medium">Username atau Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User class="w-5 h-5 text-slate-400" />
                </div>
                <input
                  v-model="loginIdentifier"
                  type="text"
                  placeholder="username atau email@example.com"
                  class="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label class="text-sm text-slate-600 mb-1.5 block font-medium">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock class="w-5 h-5 text-slate-400" />
                </div>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <Eye v-if="!showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="rememberMe" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span class="text-slate-600">Ingat saya</span>
              </label>
              <a href="#" class="text-indigo-600 hover:text-indigo-700 font-medium">Lupa password?</a>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
              {{ error }}
            </div>

            <!-- Submit Button -->
            <motion.button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3.5 bg-sultan-gold hover:bg-yellow-500 text-sultan-dark font-bold rounded-xl shadow-lg shadow-sultan-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :whileHover="{ scale: isLoading ? 1 : 1.02 }"
              :whileTap="{ scale: isLoading ? 1 : 0.98 }"
            >
              <span v-if="isLoading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Masuk...
              </span>
              <span v-else>MASUK JURAGAN</span>
            </motion.button>
          </form>
        </div>

        <!-- Footer -->
        <p class="text-center text-slate-400 text-sm mt-6">
          © 2026 SULTAN Estate Management. All rights reserved.
        </p>
      </motion.div>
    </div>
  </div>
</template>
