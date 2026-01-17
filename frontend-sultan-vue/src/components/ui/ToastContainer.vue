<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToastStore, type ToastType } from '@/stores/toast'

const toastStore = useToastStore()

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const styles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-500',
    border: 'border-emerald-200'
  },
  error: {
    bg: 'bg-rose-50',
    icon: 'text-rose-500',
    border: 'border-rose-200'
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
    border: 'border-amber-200'
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'text-blue-500',
    border: 'border-blue-200'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        <motion.div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :initial="{ opacity: 0, x: 100, scale: 0.9 }"
          :animate="{ opacity: 1, x: 0, scale: 1 }"
          :exit="{ opacity: 0, x: 100, scale: 0.9 }"
          :transition="{ duration: 0.25, ease: 'easeOut' }"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm',
            styles[toast.type].bg,
            styles[toast.type].border
          ]"
        >
          <!-- Icon -->
          <component 
            :is="icons[toast.type]" 
            :class="['w-5 h-5 mt-0.5 shrink-0', styles[toast.type].icon]" 
          />
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-800 text-sm">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-slate-600 text-xs mt-0.5">{{ toast.message }}</p>
          </div>
          
          <!-- Close Button -->
          <button
            @click="toastStore.remove(toast.id)"
            class="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
          >
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  </Teleport>
</template>
