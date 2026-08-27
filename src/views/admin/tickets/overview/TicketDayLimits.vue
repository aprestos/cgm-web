<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { DateTime } from 'luxon'
import { IconCalendarEvent, IconEdit, IconTrash } from '@tabler/icons-vue'
import BaseCard from '@/components/BaseCard.vue'
import type { TicketDay } from '@/features/tickets/ticket.model.ts'

interface Props {
  days: Array<DailyCapacity>
  loading?: boolean
}

type DailyCapacity = TicketDay & {
  sold?: number
}

defineProps<Props>()

const { t, locale } = useI18n()

const dayParts = (day: string): { weekday: string; date: string } => {
  const dt = DateTime.fromISO(day).setLocale(locale.value)
  return {
    weekday: dt.toFormat('cccc'),
    date: dt.toLocaleString({ month: 'short', day: 'numeric' }),
  }
}

const percentSold = (day: DailyCapacity): number =>
  day.quantity ? Math.round(((day.sold ?? 0) / day.quantity) * 100) : 0

const remaining = (day: DailyCapacity): number =>
  Math.max(day.quantity - (day.sold ?? 0), 0)

const progressBarColor = (day: DailyCapacity): string => {
  const percent = percentSold(day)
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

const availabilityHint = (
  day: DailyCapacity,
): { text: string; class: string } => {
  const percent = percentSold(day)
  if (percent >= 100)
    return {
      text: t('admin.tickets.status.soldOut'),
      class: 'text-red-600 dark:text-red-400',
    }
  if (percent >= 90)
    return {
      text: t('admin.tickets.almostFull'),
      class: 'text-amber-600 dark:text-amber-400',
    }
  return {
    text: t('admin.tickets.spotsLeft', { count: remaining(day) }),
    class: 'text-gray-500 dark:text-gray-400',
  }
}

const handleEdit = (): void => {
  toast.info(t('admin.tickets.editDayComingSoon'))
}

const handleDelete = (): void => {
  toast.info(t('admin.tickets.deleteDayComingSoon'))
}
</script>

<template>
  <section>
    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <BaseCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="space-y-2">
            <div class="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div class="mt-4 h-7 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div class="mt-3 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </BaseCard>
    </div>

    <!-- Empty state -->
    <p
      v-else-if="days.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('admin.tickets.noDaysAvailable') }}
    </p>

    <!-- Day tiles -->
    <div
      v-else
      class="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <BaseCard v-for="day in days" :key="day.id" class="group">
        <!-- Day label + actions -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
            >
              <IconCalendarEvent class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p
                class="truncate text-sm font-semibold capitalize text-gray-900 dark:text-white"
              >
                {{ dayParts(day.day).weekday }}
              </p>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ dayParts(day.day).date }}
              </p>
            </div>
          </div>
          <div
            class="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
          >
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-white/10 dark:hover:text-primary-400"
              :aria-label="t('common.actions.edit')"
              :title="t('common.actions.edit')"
              @click="handleEdit()"
            >
              <IconEdit class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              :aria-label="t('common.actions.delete')"
              :title="t('common.actions.delete')"
              @click="handleDelete()"
            >
              <IconTrash class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Sold / capacity -->
        <p class="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          {{ day.sold ?? 0
          }}<span
            class="ml-1 text-sm font-normal text-gray-400 dark:text-gray-500"
            >/ {{ day.quantity }}</span
          >
        </p>

        <!-- Progress -->
        <div class="mt-2 flex items-center gap-2">
          <div
            class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="progressBarColor(day)"
              :style="{ width: `${Math.min(percentSold(day), 100)}%` }"
            />
          </div>
          <span
            class="shrink-0 text-xs font-medium tabular-nums text-gray-700 dark:text-gray-300"
          >
            {{ percentSold(day) }}%
          </span>
        </div>

        <!-- Availability hint -->
        <p
          class="mt-2 text-xs font-medium"
          :class="availabilityHint(day).class"
        >
          {{ availabilityHint(day).text }}
        </p>
      </BaseCard>
    </div>
  </section>
</template>
