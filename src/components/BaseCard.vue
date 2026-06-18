<script setup lang="ts">
defineProps<{ noPadding?: boolean }>()
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800/50 ring-1 ring-slate-900/5 dark:ring-gray-800 shadow-sm rounded-2xl"
    :class="noPadding ? '' : 'p-4'"
  >
    <slot />
  </div>
</template>
