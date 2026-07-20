<script setup lang="ts">
defineProps<{ noPadding?: boolean }>()
</script>

<template>
  <div
    class="bg-white dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm rounded-2xl"
    :class="noPadding ? '' : 'p-4'"
  >
    <slot />
  </div>
</template>
