import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Use relative path so requests go through Vite proxy (solves cross-origin cookie issues)
const API_BASE = '/api/'

// Storage keys for tokens (development mode uses localStorage for refresh token)
const ACCESS_TOKEN_KEY = 'sultan_access_token'
const REFRESH_TOKEN_KEY = 'sultan_refresh_token'

// Axios instance for auth requests
const authApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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
  const accessToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize tokens from storage on store creation
  function loadTokensFromStorage() {
    accessToken.value = localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  // Save tokens to storage
  function saveTokensToStorage(access: string, refresh?: string) {
    accessToken.value = access
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    }
  }

  // Clear tokens from storage
  function clearTokensFromStorage() {
    accessToken.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

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
      
      // Store tokens (both access and refresh)
      saveTokensToStorage(response.data.access, response.data.refresh)
      
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
        saveTokensToStorage(response.data.access, response.data.refresh)
        await fetchUser()
      }
      
      return { success: true }
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } }
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
   * Logout - clears tokens
   */
  async function logout() {
    try {
      // Include auth header for proper logout on server
      await authApi.post('auth/logout/', {}, {
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      })
    } catch {
      // Ignore errors on logout - tokens will be cleared anyway
    } finally {
      clearTokensFromStorage()
      user.value = null
    }
  }

  /**
   * Refresh access token using stored refresh token
   */
  async function refreshToken() {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    
    if (!storedRefreshToken) {
      clearTokensFromStorage()
      return false
    }

    try {
      const response = await authApi.post('auth/token/refresh/', {
        refresh: storedRefreshToken
      })
      
      // Update access token
      saveTokensToStorage(response.data.access, response.data.refresh || storedRefreshToken)
      return true
    } catch {
      // Refresh failed - user needs to re-login
      clearTokensFromStorage()
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
   * Tries to restore session from stored tokens
   */
  async function initAuth() {
    loadTokensFromStorage()
    
    if (accessToken.value) {
      // Try to fetch user with existing access token
      await fetchUser()
      
      if (!user.value) {
        // Access token expired, try refresh
        const refreshed = await refreshToken()
        if (refreshed) {
          await fetchUser()
        }
      }
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
   * IMPORTANT: OAuth flow must go directly to Django (not through Vite proxy)
   * because Google redirects back to Django's callback URL directly.
   */
  function socialLogin(provider: 'google' | 'facebook') {
    window.location.href = `http://127.0.0.1:8000/accounts/${provider}/login/`
  }

  /**
   * Handle social auth callback - store tokens from URL params
   */
  function handleSocialAuthCallback(access: string, refresh?: string) {
    saveTokensToStorage(access, refresh || '')
  }

  /**
   * Set access token directly (used for social auth callback)
   */
  function setAccessToken(token: string) {
    accessToken.value = token
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
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
    handleSocialAuthCallback,
    setAccessToken
  }
})
