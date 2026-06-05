<template>
  <div class="min-h-screen px-6 py-12 lg:px-8">
    <div class="px-6 py-12 lg:px-8">
      <div class="">
        <img
          class="dark:hidden mx-auto h-16 w-auto"
          :src="
            tenantStore?.logos?.['long'] || '@/assets/logo-horizontal-color.svg'
          "
          :alt="tenantStore?.name || 'congrem.io'"
        />
        <img
          class="hidden dark:block mx-auto h-16 w-auto"
          :src="
            tenantStore?.logos?.['long'] || '@/assets/logo-horizontal-white.svg'
          "
          :alt="tenantStore?.name || 'congrem.io'"
        />
      </div>
    </div>

    <!-- Logo outside the card -->

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div
        class="md:px-6 py-8 md:shadow-sm md:ring-1 md:ring-gray-900/5 dark:ring-white/10 sm:rounded-lg sm:px-8"
      >
        <!-- Content Slot -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Auth template component - provides common layout structure for all auth pages
import { tenantStore } from '@/stores/tenant.ts'
</script>
