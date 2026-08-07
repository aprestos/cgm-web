<template>
  <div
    class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 lg:py-16 sm:px-6 md:grid-cols-3 lg:px-8"
  >
    <div>
      <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h2>
      <p class="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>
    </div>

    <div class="md:col-span-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
}

defineProps<Props>()
</script>
