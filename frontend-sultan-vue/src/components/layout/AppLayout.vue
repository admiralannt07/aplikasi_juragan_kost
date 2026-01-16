<script setup lang="ts">
import { RouterView } from 'vue-router'
import { motion } from 'motion-v'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="h-screen flex overflow-hidden bg-sultan-bg">
    <AppSidebar />
    
    <main class="flex-1 flex flex-col relative overflow-hidden">
      <AppHeader />
      
      <div class="flex-1 overflow-y-auto p-8 relative">
        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3 }"
        >
          <RouterView />
        </motion.div>
      </div>
    </main>
  </div>
</template>
