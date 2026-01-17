import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'

// Use relative path so requests go through Vite proxy (solves cross-origin cookie issues)
const API_BASE = '/api/'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Required for HttpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag to prevent multiple token refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Request interceptor - add JWT Bearer token from auth store
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from auth store (in-memory, not localStorage)
    const authStore = useAuthStore()
    const token = authStore.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const authStore = useAuthStore()
        const refreshed = await authStore.refreshToken()
        
        if (refreshed) {
          processQueue(null)
          return api(originalRequest)
        } else {
          // Refresh failed - redirect to login
          processQueue(error)
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        processQueue(error)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
