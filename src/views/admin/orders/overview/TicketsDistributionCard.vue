<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseCard from '@/components/BaseCard.vue'
import type { TicketDistributionEntry } from '@/features/orders/service'

const { t } = useI18n()

defineProps<{
  total: number
  entries: TicketDistributionEntry[]
  loading?: boolean
}>()

const SEGMENT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-teal-500',
]

const DOT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-teal-500',
]

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

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
      <div class="space-y-2">
        <div v-for="i in 3" :key="i" class="flex items-center gap-2">
          <div
            class="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"
          />
          <div class="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 ml-auto" />
        </div>
      </div>
    </div>

    <!-- Stacked bar + legend -->
    <div v-else class="space-y-4">
      <!-- Single stacked bar -->
      <div
        class="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
      >
        <div
          v-for="(entry, index) in entries"
          :key="entry.label"
          :class="SEGMENT_COLORS[index % SEGMENT_COLORS.length]"
          class="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
          :style="{ width: `${percentage(entry.count, total)}%` }"
        />
      </div>

      <!-- Legend -->
      <div class="space-y-2">
        <div
          v-for="(entry, index) in entries"
          :key="entry.label"
          class="flex items-center gap-2"
        >
          <span
            :class="DOT_COLORS[index % DOT_COLORS.length]"
            class="h-2.5 w-2.5 rounded-full shrink-0"
          />
          <span
            class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1"
          >
            {{ entry.label }}
          </span>
          <span
            class="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0"
          >
            {{ entry.count }}
            <span class="text-gray-400"
              >({{ percentage(entry.count, total) }}%)</span
            >
          </span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
