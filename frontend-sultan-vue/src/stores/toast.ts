import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  duration?: number
}

let toastIdCounter = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function show(
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 4000
  ) {
    const id = ++toastIdCounter
    
    toasts.value.push({
      id,
      type,
      title,
      message,
      duration
    })

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function clear() {
    toasts.value = []
  }

  // Convenience methods
  function success(title: string, message?: string) {
    return show('success', title, message)
  }

  function error(title: string, message?: string) {
    return show('error', title, message, 6000) // Errors stay longer
  }

  function warning(title: string, message?: string) {
    return show('warning', title, message)
  }

  function info(title: string, message?: string) {
    return show('info', title, message)
  }

  return {
    toasts,
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info
  }
})
