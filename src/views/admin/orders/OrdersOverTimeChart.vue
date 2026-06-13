<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import type { Period, PeriodParams } from './orders.types'

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
}>()

const emit = defineEmits<{
  periodChange: [params: PeriodParams]
}>()

const { t } = useI18n()

const selectedPeriod = ref<Period>('1m')

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

function getGranularity(period: Period): ChartGranularity {
  if (period === '1d') return '30min'
  if (period === '1w') return '6h'
  return '1d'
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

function buildParams(period: Period): PeriodParams {
  return { period, ...getDateRange(period), granularity: getGranularity(period) }
}

function selectPeriod(period: Period): void {
  selectedPeriod.value = period
  emit('periodChange', buildParams(period))
}

onMounted(() => emit('periodChange', buildParams(selectedPeriod.value)))

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
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => {
  const { from, to } = getDateRange(selectedPeriod.value)
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
        time: getTimeScaleConfig(selectedPeriod.value),
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(156,163,175,0.1)' },
        ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1 },
      },
    },
  }
})
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 sm:rounded-xl shadow-sm sm:border border-gray-200 dark:border-gray-700"
  >
    <div
      class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4"
    >
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ t('admin.orders.chartTitle') }}
      </h2>
      <div
        class="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1"
      >
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer"
          :class="
            selectedPeriod === option.value
              ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          "
          @click="selectPeriod(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="p-6">
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
  </div>
</template>
