<script setup lang="ts">
import type { User } from '@/features/users/service.ts'
import { IconMail } from '@tabler/icons-vue'

interface Props {
  user: User | null
  isLoading: boolean
}

defineProps<Props>()
</script>

<template>
  <div
    class="md:bg-white md:dark:bg-gray-800 md:rounded-2xl md:shadow-lg overflow-hidden"
  >
    <div class="bg-gradient-to-r from-primary-600 to-primary-400 h-32"></div>
    <div class="px-6 pb-6 -mt-16 relative z-10">
      <div class="flex flex-col sm:flex-row sm:items-end sm:gap-6">
        <div
          class="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white dark:border-gray-900 flex-shrink-0"
        >
          {{ user?.name?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="flex-1 mt-4 sm:mt-0">
          <div v-if="isLoading" class="space-y-3 animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
          <div v-else class="space-y-2">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ user?.name }}
            </h1>
            <div
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <IconMail class="size-5" />
              <span>{{ user?.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
