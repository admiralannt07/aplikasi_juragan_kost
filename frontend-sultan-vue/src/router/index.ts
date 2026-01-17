import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'kamar',
          name: 'kamar',
          component: () => import('@/views/KamarView.vue')
        },
        {
          path: 'penyewa',
          name: 'penyewa',
          component: () => import('@/views/PenyewaView.vue')
        },
        {
          path: 'keuangan',
          name: 'keuangan',
          component: () => import('@/views/KeuanganView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue')
        }
      ]
    },
    // OAuth callback route - handles token from social login redirect
    {
      path: '/oauth-callback',
      name: 'oauth-callback',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    }
  ]
})

// Navigation guard for JWT auth
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Check for tokens in URL query params (from social auth redirect)
  const accessTokenFromUrl = to.query.access_token as string | undefined
  const refreshTokenFromUrl = to.query.refresh_token as string | undefined
  
  if (accessTokenFromUrl) {
    console.log('[OAuth] Captured tokens from URL redirect')
    
    // Social auth callback - capture both tokens
    authStore.handleSocialAuthCallback(accessTokenFromUrl, refreshTokenFromUrl)
    await authStore.fetchUser()
    
    // Redirect to dashboard without tokens in URL (security)
    next({ name: 'dashboard', replace: true })
    return
  }
  
  // Check authentication from store (in-memory token)
  const isAuthenticated = authStore.isAuthenticated
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Try to restore session from HttpOnly refresh cookie
    await authStore.initAuth()
    
    if (authStore.isAuthenticated) {
      next()
    } else {
      next({ name: 'login' })
    }
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
