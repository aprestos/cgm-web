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
  loading: boolean
}>()

const { t } = useI18n()

const avgOrderValue = computed(() =>
  props.ordersCount ? Math.round(props.ordersRevenue / props.ordersCount) : 0,
)
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
    <StatisticCard
      :label="t('admin.orders.totalOrders')"
      :value="ordersCount"
      :icon="IconShoppingCart"
      :loading="loading"
      color="fuchsia"
      :subtitle="t('admin.orders.totalOrdersSubtitle')"
    />
    <StatisticCard
      :label="t('admin.orders.totalRevenue')"
      :value="formatPrice(ordersRevenue)"
      :icon="IconCurrencyEuro"
      :loading="loading"
      color="green"
      :subtitle="t('admin.orders.totalRevenueSubtitle')"
    />
    <StatisticCard
      :label="t('admin.orders.ticketsSold')"
      :value="orderItemsCounts"
      :icon="IconTicket"
      :loading="loading"
      color="sky"
      :subtitle="t('admin.orders.ticketsSoldSubtitle')"
    />
    <StatisticCard
      :label="t('admin.orders.avgOrderValue')"
      :value="formatPrice(avgOrderValue)"
      :icon="IconTrendingUp"
      :loading="loading"
      color="amber"
      :subtitle="t('admin.orders.avgOrderValueSubtitle')"
    />
  </div>
</template>
