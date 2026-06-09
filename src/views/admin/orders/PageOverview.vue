<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
import {
  IconChartLine,
  IconCurrencyEuro,
  IconShoppingCart,
  IconTicket,
  IconTrendingUp,
} from '@tabler/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatisticCard from '@/components/StatisticCard.vue'
import type {
  ChartGranularity,
  OrdersOverTimeEntry,
} from '@/features/orders/service'
import orderService from '@/features/orders/service'
import { tenantStore } from '@/stores/tenant'
import { editionStore } from '@/stores/edition'
import { formatPrice } from '@/utils/price'
import logger from '@/lib/logger'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

const { t } = useI18n()

type Period = '1d' | '1w' | '1m' | 'all'

const selectedPeriod = ref<Period>('1m')
const chartLoading = ref(false)
const chartEntries = ref<OrdersOverTimeEntry[]>([])
const ordersCount = ref<number>(0)
const ordersRevenue = ref<number>(0)
const orderItemsCounts = ref<number>(0)

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

async function loadStats(): Promise<void> {
  if (!tenantStore.value?.id || !editionStore.value?.id) return
  chartLoading.value = true
  try {
    const { from, to } = getDateRange(selectedPeriod.value)

    const [ordersOverTime, stats, itemsStats] = await Promise.all([
      orderService.getOrdersOverTime(
        tenantStore.value.id,
        editionStore.value.id,
        from,
        to,
        getGranularity(selectedPeriod.value),
      ),
      orderService.getOrdersCount(tenantStore.value.id),
      orderService.getOrderItemsCount(tenantStore.value.id),
    ])

    chartEntries.value = ordersOverTime
    ordersCount.value = stats.count
    ordersRevenue.value = stats.revenue
    orderItemsCounts.value = itemsStats
  } catch (error) {
    logger.error('Failed to load orders stats', { error })
  } finally {
    chartLoading.value = false
  }
}

const chartData = computed(() => ({
  labels: chartEntries.value.map((e) => e.date),
  datasets: [
    {
      label: t('admin.orders.chartDatasetLabel'),
      data: chartEntries.value.map((e) => e.count),
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

watch(selectedPeriod, loadStats)
onMounted(loadStats)
</script>

<template>
  <div class="flex flex-col space-y-6 p-6">
    <PageHeader
      :title="t('admin.orders.title')"
      :description="t('admin.orders.description')"
      class="p-6 sm:p-0"
    />

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 sm:gap-6">
      <StatisticCard
        :label="t('admin.orders.totalOrders')"
        :value="ordersCount"
        :icon="IconShoppingCart"
        icon-color="text-indigo-600 dark:text-indigo-400"
        :subtitle="t('admin.orders.totalOrdersSubtitle')"
      />
      <StatisticCard
        :label="t('admin.orders.totalRevenue')"
        :value="formatPrice(ordersRevenue)"
        :icon="IconCurrencyEuro"
        icon-color="text-green-600 dark:text-green-400"
        :subtitle="t('admin.orders.totalRevenueSubtitle')"
      />
      <StatisticCard
        :label="t('admin.orders.ticketsSold')"
        :value="orderItemsCounts"
        :icon="IconTicket"
        icon-color="text-blue-600 dark:text-blue-400"
        :subtitle="t('admin.orders.ticketsSoldSubtitle')"
      />
      <StatisticCard
        :label="t('admin.orders.avgOrderValue')"
        :value="formatPrice(ordersCount ? Math.round(ordersRevenue / ordersCount) : 0)"
        :icon="IconTrendingUp"
        icon-color="text-amber-600 dark:text-amber-400"
        :subtitle="t('admin.orders.avgOrderValueSubtitle')"
      />
    </div>

    <!-- Orders Over Time Chart -->
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
            @click="selectedPeriod = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="chartLoading" class="flex items-center justify-center h-64">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
          />
        </div>

        <div
          v-else-if="chartEntries.length === 0"
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
  </div>
</template>
