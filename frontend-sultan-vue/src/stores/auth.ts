import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api/'

// Axios instance with credentials for HttpOnly cookies
const authApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Required for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface User {
  pk: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface LoginCredentials {
  username?: string
  email?: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password1: string
  password2: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null) // Stored in memory, NOT localStorage
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!accessToken.value)
  const displayName = computed(() => {
    if (!user.value) return ''
    return user.value.first_name || user.value.username
  })

  // === ACTIONS ===

  /**
   * Login with username/email and password
   */
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await authApi.post('auth/login/', credentials)
      
      // dj-rest-auth with JWT returns access token in response
      // Refresh token is set as HttpOnly cookie automatically
      accessToken.value = response.data.access
      
      // Fetch user info
      await fetchUser()
      
      return { success: true }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { non_field_errors?: string[]; detail?: string } } }
      error.value = err.response?.data?.non_field_errors?.[0] 
        || err.response?.data?.detail 
        || 'Login gagal. Periksa username/email dan password.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register a new user
   */
  async function register(data: RegisterData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await authApi.post('auth/registration/', data)
      
      // If registration returns tokens, user is logged in
      if (response.data.access) {
        accessToken.value = response.data.access
        await fetchUser()
      }
      
      return { success: true }
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } }
      // Parse validation errors
      const data = err.response?.data
      if (data) {
        const firstError = Object.values(data)[0]
        error.value = Array.isArray(firstError) ? (firstError[0] ?? 'Registrasi gagal.') : String(firstError)
      } else {
        error.value = 'Registrasi gagal.'
      }
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout - clears tokens and calls backend to blacklist refresh token
   */
  async function logout() {
    try {
      await authApi.post('auth/logout/')
    } catch {
      // Ignore errors on logout
    } finally {
      accessToken.value = null
      user.value = null
    }
  }

  /**
   * Refresh access token using HttpOnly refresh cookie
   */
  async function refreshToken() {
    try {
      const response = await authApi.post('auth/token/refresh/')
      accessToken.value = response.data.access
      return true
    } catch {
      // Refresh failed - user needs to re-login
      accessToken.value = null
      user.value = null
      return false
    }
  }

  /**
   * Fetch current user info
   */
  async function fetchUser() {
    try {
      const response = await authApi.get('auth/user/', {
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      })
      user.value = response.data
    } catch {
      user.value = null
    }
  }

  /**
   * Initialize auth state on app load
   * Tries to refresh token from HttpOnly cookie
   */
  async function initAuth() {
    const refreshed = await refreshToken()
    if (refreshed) {
      await fetchUser()
    }
  }

  /**
   * Get authorization header for API requests
   */
  function getAuthHeader() {
    return accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}
  }

  /**
   * Social login - redirect to provider
   * allauth uses /accounts/{provider}/login/ path
   */
  function socialLogin(provider: 'google' | 'facebook') {
    // Redirect to allauth OAuth flow at /accounts/{provider}/login/
    window.location.href = `http://127.0.0.1:8000/accounts/${provider}/login/`
  }

  /**
   * Set access token directly (used for social auth callback)
   */
  function setAccessToken(token: string) {
    accessToken.value = token
  }

  return {
    // State
    user,
    accessToken,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    displayName,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    fetchUser,
    initAuth,
    getAuthHeader,
    socialLogin,
    setAccessToken
  }
})

