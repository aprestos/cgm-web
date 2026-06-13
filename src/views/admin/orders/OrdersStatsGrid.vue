<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  IconCurrencyEuro,
  IconShoppingCart,
  IconTicket,
  IconTrendingUp,
} from '@tabler/icons-vue'
import StatisticCard from '@/components/StatisticCard.vue'
import { formatPrice } from '@/utils/price'

const props = defineProps<{
  ordersCount: number
  ordersRevenue: number
  orderItemsCounts: number
}>()

const { t } = useI18n()

const avgOrderValue = computed(() =>
  props.ordersCount
    ? Math.round(props.ordersRevenue / props.ordersCount)
    : 0,
)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
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
      :value="formatPrice(avgOrderValue)"
      :icon="IconTrendingUp"
      icon-color="text-amber-600 dark:text-amber-400"
      :subtitle="t('admin.orders.avgOrderValueSubtitle')"
    />
  </div>
</template>
