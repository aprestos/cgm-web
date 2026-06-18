<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { OrdersOverTimeEntry } from '@/features/orders/service'
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

const { t } = useI18n()

const selectedPeriod = ref<Period>('1m')

const loading = ref(true)
const chartEntries = ref<OrdersOverTimeEntry[]>([])
const ordersCount = ref(0)
const ordersRevenue = ref(0)
const orderItemsCounts = ref(0)

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
  try {
    const [ordersOverTime, stats, itemsStats] = await Promise.all([
      orderService.getOrdersOverTime(
        tenantStore.value.id,
        editionStore.value.id,
        params.from,
        params.to,
        params.granularity,
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
    loading.value = false
  }
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
      :order-items-counts="orderItemsCounts"
      :loading="loading"
    />

    <OrdersOverTimeChart
      :loading="loading"
      :entries="chartEntries"
      :selected-period="selectedPeriod"
      @period-change="onPeriodChange"
    />
  </div>
</template>
