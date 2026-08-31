<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type { FilterChip } from './filterChips.model.ts'

defineProps<{
  chips: FilterChip[]
}>()

defineEmits<{
  remove: [id: string]
  clear: []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- What is applied, spelled out. A count on the filter button says how many
       filters are on; only this says which, and lets one go without reopening
       the panel. -->
  <div v-if="chips.length" class="flex flex-wrap items-center gap-2 pb-6">
    <button
      v-for="chip in chips"
      :key="chip.id"
      type="button"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-50 py-1.5 pl-3 pr-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40"
      @click="$emit('remove', chip.id)"
    >
      {{ chip.label }}
      <span class="sr-only">{{ t('common.actions.remove') }}</span>
      <XMarkIcon class="size-4 opacity-60" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 underline-offset-2 transition-colors hover:text-gray-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:text-gray-200"
      @click="$emit('clear')"
    >
      {{ t('common.actions.clearAll') }}
    </button>
  </div>
</template>

<style scoped></style>
