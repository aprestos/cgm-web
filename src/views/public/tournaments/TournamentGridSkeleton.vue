<script setup lang="ts">
import SkeletonLoader from '@/components/SkeletonLoader.vue'

withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 8,
  },
)
</script>

<template>
  <!-- Mirrors TournamentCard: a row on phones, a card from sm up -->
  <div
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 lg:gap-x-6 xl:grid-cols-4"
  >
    <div
      v-for="index in count"
      :key="index"
      class="flex flex-row gap-3 sm:flex-col"
    >
      <SkeletonLoader
        class-name="w-28 shrink-0 self-stretch rounded-xl sm:aspect-4/3 sm:w-full sm:self-auto sm:rounded-b-none sm:rounded-t-2xl"
        rounded="none"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-2 py-1 sm:py-0">
        <SkeletonLoader class-name="h-5 w-3/4" />
        <SkeletonLoader class-name="h-4 w-2/5" />
        <SkeletonLoader class-name="mt-auto h-1.5 w-full" rounded="full" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
