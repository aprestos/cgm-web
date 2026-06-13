<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import type { OrdersOverTimeEntry } from '@/features/orders/service'
import orderService from '@/features/orders/service'
import { tenantStore } from '@/stores/tenant'
import { editionStore } from '@/stores/edition'
import logger from '@/lib/logger'
import { useI18n } from 'vue-i18n'
import OrdersStatsGrid from './OrdersStatsGrid.vue'
import OrdersOverTimeChart from './OrdersOverTimeChart.vue'
import OrdersRecentList from './OrdersRecentList.vue'
import type { PeriodParams, RecentOrder } from './orders.types'

const { t } = useI18n()

const chartLoading = ref(false)
const chartEntries = ref<OrdersOverTimeEntry[]>([])
const ordersCount = ref(0)
const ordersRevenue = ref(0)
const orderItemsCounts = ref(0)

const recentOrdersLoading = ref(false)
const recentOrders = ref<RecentOrder[]>([])
const emailSearch = ref('')

async function loadStats(params: PeriodParams): Promise<void> {
  if (!tenantStore.value?.id || !editionStore.value?.id) return
  chartLoading.value = true
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
    chartLoading.value = false
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

function onSearch(email: string): void {
  emailSearch.value = email
  void loadRecentOrders()
}

onMounted(() => void loadRecentOrders())
</script>

<template>
  <div class="flex flex-col space-y-6 p-0 sm:p-6">
    <PageHeader
      :title="t('admin.orders.title')"
      :description="t('admin.orders.description')"
      class="hidden lg:block p-6 sm:p-0"
    />

    <OrdersStatsGrid
      :orders-count="ordersCount"
      :orders-revenue="ordersRevenue"
      :order-items-counts="orderItemsCounts"
    />

    <OrdersOverTimeChart
      :loading="chartLoading"
      :entries="chartEntries"
      @period-change="loadStats"
    />

    <OrdersRecentList
      :loading="recentOrdersLoading"
      :orders="recentOrders"
      @search="onSearch"
    />
  </div>
</template>
