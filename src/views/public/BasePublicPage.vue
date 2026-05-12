<template>
  <div class="min-h-screen">
    <TopNavigation />

    <div>
      <main>
        <div class="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 xl:px-0">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import TopNavigation from '@/components/TopNavigation.vue'

defineProps({})
</script>
