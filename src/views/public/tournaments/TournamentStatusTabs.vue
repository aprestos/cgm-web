<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  STATUS_TABS,
  type StatusCounts,
  type StatusTab,
} from './tournaments.filters.ts'

defineProps<{
  modelValue: StatusTab
  counts: StatusCounts
}>()

defineEmits<{
  'update:modelValue': [value: StatusTab]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
    <button
      v-for="status in STATUS_TABS"
      :key="status"
      type="button"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
      :class="
        modelValue === status
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
      "
      @click="$emit('update:modelValue', status)"
    >
      {{ t(`public.tournaments.tabs.${status}`) }}
      <span class="ml-1 opacity-60">{{ counts[status] }}</span>
    </button>
  </div>
</template>

<style scoped></style>
