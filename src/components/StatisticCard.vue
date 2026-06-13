<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label: string
  value: string | number
  icon: Component
  iconColor?: string
  valueColor?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-gray-900 dark:text-gray-400',
  valueColor: 'text-gray-900 dark:text-white',
  subtitle: '',
})
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 px-4 py-3 sm:rounded-lg sm:shadow-sm sm:p-6"
  >
    <!-- Mobile: single line -->
    <div class="flex items-center gap-3 sm:hidden">
      <component :is="icon" class="size-5 shrink-0" :class="iconColor" />
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{{ label }}</span>
      <span class="ml-auto text-sm font-bold shrink-0" :class="valueColor">{{ value }}</span>
    </div>

    <!-- Desktop: original stacked layout -->
    <div class="hidden sm:flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ label }}</p>
        <p class="mt-2 text-2xl font-bold" :class="valueColor">{{ value }}</p>
        <p v-if="subtitle" class="mt-2 text-xs text-gray-600 dark:text-gray-400">{{ subtitle }}</p>
      </div>
      <component :is="icon" class="size-8" :class="iconColor" />
    </div>
  </div>
</template>
