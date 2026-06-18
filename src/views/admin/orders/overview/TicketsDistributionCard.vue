<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseCard from '@/components/BaseCard.vue'

const { t } = useI18n()

export interface TicketDistributionEntry {
  label: string
  count: number
  total: number
}

defineProps<{
  entries: TicketDistributionEntry[]
  loading?: boolean
}>()

function percentage(count: number, total: number): number {
  if (!total) return 0
  return Math.round((count / total) * 100)
}
</script>

<template>
  <BaseCard>
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
      {{ t('admin.orders.ticketDistributionTitle') }}
    </h3>

    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="space-y-1.5">
        <div class="flex justify-between">
          <div class="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-3 w-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <div v-else class="space-y-4">
      <div v-for="entry in entries" :key="entry.label">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            entry.label
          }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {{ entry.count }}
            <span class="text-gray-400"
              >({{ percentage(entry.count, entry.total) }}%)</span
            >
          </span>
        </div>
        <div class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            class="h-2 rounded-full bg-indigo-500 transition-all duration-500"
            :style="{ width: `${percentage(entry.count, entry.total)}%` }"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>
