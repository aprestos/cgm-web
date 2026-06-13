<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { IconSearch, IconShoppingCart } from '@tabler/icons-vue'
import { formatPrice } from '@/utils/price'
import type { RecentOrder } from './orders.types'
import { shortId } from '@/utils/order.ts'

defineProps<{
  loading: boolean
  orders: RecentOrder[]
}>()

const emit = defineEmits<{
  search: [email: string]
}>()

const debouncedSearch = useDebounceFn(
  (value: string) => emit('search', value),
  300,
)

const { t } = useI18n()

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
  <div
    class="bg-white dark:bg-gray-800 sm:rounded-xl shadow-sm sm:border border-gray-200 dark:border-gray-700"
  >
    <div
      class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4"
    >
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('admin.orders.recentOrdersTitle') }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ t('admin.orders.recentOrdersDescription') }}
        </p>
      </div>
      <div class="relative w-full sm:w-72">
        <IconSearch
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :placeholder="t('admin.orders.searchByUserIdPlaceholder')"
          @input="debouncedSearch(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="overflow-x-auto">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
        />
      </div>

      <div
        v-else-if="orders.length === 0"
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

      <table v-else class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
          >
            <th class="px-6 py-3 text-left">
              {{ t('admin.orders.colOrderId') }}
            </th>
            <th class="px-6 py-3 text-left">
              {{ t('admin.orders.colUserId') }}
            </th>
            <th class="px-6 py-3 text-left">
              {{ t('admin.orders.colStatus') }}
            </th>
            <th class="px-6 py-3 text-right">
              {{ t('admin.orders.colTotal') }}
            </th>
            <th class="px-6 py-3 text-right">
              {{ t('admin.orders.colDate') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td
              class="px-6 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-45"
            >
              {{ shortId(order.id) }}
            </td>
            <td
              class="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-45"
            >
              {{ order.profiles?.email ?? order.customer_id ?? '—' }}
            </td>
            <td class="px-6 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    getStatusColor(order.status) === 'green',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    getStatusColor(order.status) === 'yellow',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    getStatusColor(order.status) === 'red',
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400':
                    getStatusColor(order.status) === 'gray',
                }"
              >
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td
              class="px-6 py-3 text-right text-gray-900 dark:text-white font-medium"
            >
              {{ formatPrice(order.total) }}
            </td>
            <td
              class="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
            >
              {{ formatDate(order.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
