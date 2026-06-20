<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconEye, IconShoppingCart } from '@tabler/icons-vue'
import { formatPrice } from '@/utils/price'
import { shortId } from '@/utils/order.ts'
import type { RecentOrder } from '@/views/admin/orders/overview/orders.types.ts'
import BaseCard from '@/components/BaseCard.vue'
import type { DataTableColumn } from '@/components/DataTable.vue'
import DataTable from '@/components/DataTable.vue'

defineProps<{
  loading: boolean
  orders: RecentOrder[]
}>()

const emit = defineEmits<{
  viewDetails: [orderId: string]
}>()

const { t } = useI18n()

const columns: DataTableColumn<RecentOrder>[] = [
  {
    key: 'id',
    label: t('admin.orders.colOrderId'),
    sortable: false,
  },
  {
    key: 'customer',
    label: t('admin.orders.colUserId'),
    cellClass: 'whitespace-nowrap',
    sortable: false,
  },
  {
    key: 'status',
    label: t('admin.orders.colStatus'),
    sortable: true,
    breakpoint: 'sm',
  },
  {
    key: 'total',
    label: t('admin.orders.colTotal'),
    sortable: false,
    headerClass: 'text-right',
    breakpoint: 'md',
    cellClass: 'text-right text-gray-900 dark:text-white font-medium',
  },
  {
    key: 'created_at',
    label: t('admin.orders.colDate'),
    sortable: false,
    headerClass: 'text-right',
    breakpoint: 'md',
    cellClass:
      'text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap',
  },
]

function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  if (status === 'paid') return 'green'
  if (status === 'placed') return 'yellow'
  if (status === 'canceled' || status === 'failed') return 'red'
  return 'gray'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    paid: t('admin.orders.statusPaid'),
    placed: t('admin.orders.statusPlaced'),
    canceled: t('admin.orders.statusCanceled'),
    failed: t('admin.orders.statusFailed'),
  }
  return map[status] ?? status
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <BaseCard no-padding>
    <div
      v-if="!loading && orders.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <IconShoppingCart
        class="size-10 text-gray-300 dark:text-gray-600"
        stroke="1.5"
      />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {{ t('admin.orders.noRecentOrders') }}
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <DataTable
        :items="orders"
        :columns="columns"
        :loading="loading"
        row-key="id"
      >
        <template #cell-id="{ item }">
          <span class="font-mono text-xs text-gray-700 dark:text-gray-300">
            {{ shortId(item.id) }}
          </span>
        </template>

        <template #cell-customer="{ item }">
          <span class="text-gray-700 dark:text-gray-300">
            {{ item.profiles?.name ?? item.profiles?.email ?? '—' }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                getStatusColor(item.status) === 'green',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                getStatusColor(item.status) === 'yellow',
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                getStatusColor(item.status) === 'red',
              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400':
                getStatusColor(item.status) === 'gray',
            }"
          >
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <template #cell-total="{ item }">
          {{ formatPrice(item.total) }}
        </template>

        <template #cell-created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #actions="{ item }">
          <button
            type="button"
            class="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            :title="t('admin.orders.viewDetails')"
            @click="emit('viewDetails', item.id)"
          >
            <IconEye class="size-4" />
          </button>
        </template>
      </DataTable>
    </div>
  </BaseCard>
</template>
