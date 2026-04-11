<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/routeNames.ts'

interface Props {
  tenantLogo?: string
  tenantName?: string
  editionName?: string
}

defineProps<Props>()
</script>

<template>
  <header
    class="fixed left-0 top-0 z-40 flex items-center p-6 transition-all duration-300"
  >
    <RouterLink
      :to="{ name: RouteNames.public.home }"
      class="group flex items-center gap-3"
    >
      <!-- Logo -->
      <div
        v-if="tenantLogo"
        class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/90 dark:bg-gray-900/90 p-2 shadow-lg backdrop-blur-sm ring-1 ring-gray-200 dark:ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
      >
        <img
          :src="tenantLogo"
          :alt="tenantName || 'Logo'"
          class="h-full w-full object-contain"
        />
      </div>

      <!-- Text (optional, shows on larger screens) -->
      <div
        v-if="editionName"
        class="hidden rounded-lg bg-white/90 dark:bg-gray-900/90 px-4 py-2 shadow-lg backdrop-blur-sm ring-1 ring-gray-200 dark:ring-white/10 transition-all duration-300 group-hover:shadow-xl lg:block"
      >
        <span class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ editionName }}
        </span>
      </div>
    </RouterLink>
  </header>
</template>
