<script setup lang="ts">
import type { LibraryWithdraw } from '@/features/library/withdraws/service.ts'
import { DateTime } from 'luxon'

interface Props {
  withdraws: LibraryWithdraw[]
}

defineProps<Props>()

function getDay(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === 'string'
        ? DateTime.fromISO(dateStr)
        : DateTime.fromMillis(Number(dateStr))
    return date.toFormat('dd')
  } catch {
    return '--'
  }
}

function getMonth(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === 'string'
        ? DateTime.fromISO(dateStr)
        : DateTime.fromMillis(Number(dateStr))
    return date.toFormat('MMM')
  } catch {
    return '---'
  }
}
</script>

<template>
  <div class="relative">
    <!-- Continuous timeline line -->
    <div
      class="absolute left-20 top-3 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"
    ></div>

    <!-- Timeline items -->
    <div class="space-y-6">
      <div
        v-for="withdraw in withdraws"
        :key="withdraw.id"
        class="flex gap-4 relative"
      >
        <!-- Day badge -->
        <div class="w-16 flex-shrink-0 text-center pt-1">
          <div
            class="rounded-lg bg-primary-100 dark:bg-primary-900/30 px-2 py-1"
          >
            <div
              class="text-sm font-bold text-primary-600 dark:text-primary-400"
            >
              {{ getDay(withdraw.started_at) }}
            </div>
            <div
              class="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wider"
            >
              {{ getMonth(withdraw.started_at) }}
            </div>
          </div>
        </div>

        <!-- Timeline dot -->
        <div class="flex flex-col items-center pt-1">
          <div
            :class="[
              'w-3 h-3 rounded-full ring-4 relative z-10',
              withdraw.ended_at
                ? 'bg-green-500 ring-white dark:ring-gray-900'
                : 'bg-blue-500 ring-white dark:ring-gray-900',
            ]"
          ></div>
        </div>

        <!-- Card slot -->
        <div class="flex-1 pb-4">
          <slot name="card" :withdraw="withdraw"></slot>
        </div>
      </div>
    </div>
  </div>
</template>
