<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type {
  OrdersOverTimeEntry,
  TicketsStats,
} from '@/features/orders/service'
import orderService from '@/features/orders/service'
import { tenantStore } from '@/stores/tenant'
import { editionStore } from '@/stores/edition'
import logger from '@/lib/logger'
import { useI18n } from 'vue-i18n'
import OrdersStatsGrid from './OrdersStatsGrid.vue'
import OrdersOverTimeChart from './OrdersOverTimeChart.vue'
import type {
  Period,
  PeriodParams,
  RecentOrder,
} from '@/views/admin/orders/overview/orders.types.ts'
import PageHeader from '@/components/PageHeader.vue'
import TicketsDistributionCard from '@/views/admin/orders/overview/TicketsDistributionCard.vue'

const { t, locale } = useI18n()

const selectedPeriod = ref<Period>('1m')

const loading = ref(true)
const chartEntries = ref<OrdersOverTimeEntry[]>([])
const ordersCount = ref(0)
const ordersRevenue = ref(0)

const ticketStats = ref<TicketsStats>({ total: 0, distribution: [] })

const recentOrdersLoading = ref(false)
const recentOrders = ref<RecentOrder[]>([])
const emailSearch = ref('')

function getDateRange(period: Period): { from?: string; to?: string } {
  if (period === 'all') return {}
  const now = new Date()
  const from = new Date(now)
  if (period === '1d') from.setDate(from.getDate() - 1)
  else if (period === '1w') from.setDate(from.getDate() - 7)
  else if (period === '1m') from.setMonth(from.getMonth() - 1)
  return { from: from.toISOString(), to: now.toISOString() }
}

function getGranularity(period: Period): PeriodParams['granularity'] {
  if (period === '1d') return '1h'
  if (period === '1w') return '1d'
  return '1d'
}

function buildParams(period: Period): PeriodParams {
  return {
    period,
    ...getDateRange(period),
    granularity: getGranularity(period),
  }
}

function onPeriodChange(period: Period): void {
  selectedPeriod.value = period
  void loadStats(buildParams(period))
}

async function loadStats(params: PeriodParams): Promise<void> {
  if (!tenantStore.value?.id || !editionStore.value?.id) return
  const [ordersOverTime, stats, distribution] = await Promise.allSettled([
    orderService.getOrdersOverTime(
      tenantStore.value.id,
      editionStore.value.id,
      params.from,
      params.to,
      params.granularity,
    ),
    orderService.getOrdersCount(tenantStore.value.id),
    orderService.getTicketsDistribution(
      tenantStore.value.id,
      editionStore.value.id,
      locale.value,
    ),
  ])

  if (ordersOverTime.status === 'fulfilled')
    chartEntries.value = ordersOverTime.value
  if (stats.status === 'fulfilled') {
    ordersCount.value = stats.value.count
    ordersRevenue.value = stats.value.revenue
  }
  if (distribution.status === 'fulfilled') {
    ticketStats.value = distribution.value
  }

  if (ordersOverTime.status === 'rejected')
    logger.error('Failed to load orders over time', {
      error: ordersOverTime.reason,
    })
  if (stats.status === 'rejected')
    logger.error('Failed to load orders count', { error: stats.reason })
  if (distribution.status === 'rejected')
    logger.error('Failed to load tickets distribution', {
      error: distribution.reason,
    })

  loading.value = false
}

async function loadRecentOrders(): Promise<void> {
  if (!tenantStore.value?.id) return
  recentOrdersLoading.value = true
  try {
    recentOrders.value = await orderService.getOrders(
      tenantStore.value.id,
      emailSearch.value.trim() || undefined,
    )
  } catch (error) {
    logger.error('Failed to load recent orders', { error })
  } finally {
    recentOrdersLoading.value = false
  }
}

onMounted(() => {
  void loadRecentOrders()
  void loadStats(buildParams(selectedPeriod.value))
})
</script>

<template>
  <div class="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
    <PageHeader
      :title="t('admin.orders.overview.title')"
      :description="t('admin.orders.overview.description')"
    />
    <OrdersStatsGrid
      :orders-count="ordersCount"
      :orders-revenue="ordersRevenue"
      :order-items-counts="ticketStats.total"
      :loading="loading"
    />

    <OrdersOverTimeChart
      :loading="loading"
      :entries="chartEntries"
      :selected-period="selectedPeriod"
      @period-change="onPeriodChange"
    />
    <TicketsDistributionCard
      :total="ticketStats.total"
      :entries="ticketStats.distribution"
      :loading="loading"
    />
  </div>
</template>
