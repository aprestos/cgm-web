<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js'
import 'chartjs-adapter-luxon'
import { IconChartLine } from '@tabler/icons-vue'
import type { OrdersOverTimeEntry } from '@/features/orders/service'
import type { Period } from './orders.types'
import BaseCard from '@/components/BaseCard.vue'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{
  loading: boolean
  entries: OrdersOverTimeEntry[]
  selectedPeriod: Period
}>()

const emit = defineEmits<{
  periodChange: [period: Period]
}>()

const { t } = useI18n()

const periodOptions = computed<{ label: string; value: Period }[]>(() => [
  { label: t('admin.orders.period1d'), value: '1d' },
  { label: t('admin.orders.period1w'), value: '1w' },
  { label: t('admin.orders.period1m'), value: '1m' },
  { label: t('admin.orders.periodAll'), value: 'all' },
])

function getDateRange(period: Period): { from?: string; to?: string } {
  if (period === 'all') return {}
  const now = new Date()
  const from = new Date(now)
  if (period === '1d') from.setDate(from.getDate() - 1)
  else if (period === '1w') from.setDate(from.getDate() - 7)
  else if (period === '1m') from.setMonth(from.getMonth() - 1)
  return { from: from.toISOString(), to: now.toISOString() }
}

function getTimeScaleConfig(period: Period): {
  unit: 'hour' | 'day'
  displayFormats: Record<string, string>
  tooltipFormat: string
} {
  if (period === '1d') {
    return {
      unit: 'hour' as const,
      displayFormats: { hour: 'HH:mm' },
      tooltipFormat: 'HH:mm',
    }
  }
  if (period === '1w') {
    return {
      unit: 'day' as const,
      displayFormats: { day: 'ccc d' },
      tooltipFormat: 'MMM d, HH:mm',
    }
  }
  return {
    unit: 'day' as const,
    displayFormats: { day: 'MMM d' },
    tooltipFormat: 'MMM d, yyyy',
  }
}

function selectPeriod(period: Period): void {
  emit('periodChange', period)
}

const chartData = computed(() => ({
  labels: props.entries.map((e) => e.date),
  datasets: [
    {
      label: t('admin.orders.chartDatasetLabel'),
      data: props.entries.map((e) => e.count),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => {
  const { from, to } = getDateRange(props.selectedPeriod)
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        min: from,
        max: to,
        time: getTimeScaleConfig(props.selectedPeriod),
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 12 } },
      },
      y: {
        display: false,
        beginAtZero: true,
        grid: { display: false },
      },
    },
  }
})
</script>

<template>
  <div>
    <BaseCard>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div
          class="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1"
        >
          <button
            v-for="option in periodOptions"
            :key="option.value"
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer"
            :class="
              props.selectedPeriod === option.value
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            "
            @click="selectPeriod(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="mt-4">
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
          />
        </div>

        <div
          v-else-if="entries.length === 0"
          class="flex flex-col items-center justify-center h-64 text-center"
        >
          <IconChartLine
            class="size-12 text-gray-300 dark:text-gray-600"
            stroke="1.5"
          />
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.orders.noOrdersInPeriod') }}
          </p>
        </div>

        <div v-else class="h-64">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </BaseCard>
  </div>
</template>
