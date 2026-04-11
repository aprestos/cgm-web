<script setup lang="ts">
import { computed } from 'vue'
import { IconTicket, IconEye, IconEdit, IconTrash } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import CBadge from '@/components/CBadge.vue'
import DataTable from '@/components/DataTable.vue'
import type { DataTableColumn } from '@/components/DataTable.vue'
import type { Ticket } from '@/features/tickets/ticket.model'
import { formatPrice } from '@/utils/price.ts'
import { DateTime } from 'luxon'

interface Props {
  tickets: Ticket[]
}

defineProps<Props>()

const emit = defineEmits<{
  view: [ticket: Ticket]
  edit: [ticket: Ticket]
  delete: [ticket: Ticket]
}>()

const { t, locale } = useI18n()

// Table columns definition
const tableColumns = computed<DataTableColumn<Ticket>[]>(() => [
  { key: 'name', label: t('admin.tickets.name'), sortable: true },
  { key: 'price', label: t('admin.tickets.price'), sortable: true },
  { key: 'quantity', label: t('admin.tickets.quantity'), sortable: true },
  { key: 'status', label: t('admin.tickets.status'), sortable: true },
  {
    key: 'sale_period',
    label: t('admin.tickets.salePeriod'),
    sortable: false,
    breakpoint: 'lg',
  },
  {
    key: 'valid_period',
    label: t('admin.tickets.validPeriod'),
    sortable: false,
    breakpoint: 'lg',
  },
])

const getStatusBadgeVariant = (
  ticket: Ticket,
): 'success' | 'warning' | 'danger' => {
  return ticket.active ? 'success' : 'danger'
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'

  return DateTime.fromISO(dateStr).toLocaleString(
    { day: 'numeric', weekday: 'long' },
    { locale: locale.value },
  )
}

const formatDateRange = (
  from: string | undefined,
  until: string | undefined,
): string => {
  if (!from || !until) return '-'

  const fromDate = formatDate(from)
  const untilDate = formatDate(until)

  if (fromDate === untilDate) {
    return fromDate
  } else {
    return `${formatDate(from)} - ${formatDate(until)}`
  }
}
</script>

<template>
  <!-- Empty State -->
  <div
    v-if="tickets.length === 0"
    class="flex flex-col items-center justify-center py-12 px-6 text-center"
  >
    <IconTicket
      class="h-12 w-12 text-gray-400 dark:text-gray-500"
      stroke="1.5"
    />
    <h3 class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
      {{ t('admin.tickets.noTicketsInGroup') }}
    </h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ t('admin.tickets.clickAddToCreate') }}
    </p>
  </div>

  <!-- DataTable -->
  <DataTable
    v-else
    :items="tickets"
    :columns="tableColumns"
    :items-per-page="10"
  >
    <!-- Custom cell for name -->
    <template #cell-name="{ item }">
      <div class="text-sm font-medium text-gray-900 dark:text-white">
        {{ item.name }}
      </div>
    </template>

    <!-- Custom cell for price -->
    <template #cell-price="{ item }">
      <div class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ formatPrice(item.price) }}
      </div>
    </template>

    <!-- Custom cell for quantity -->
    <template #cell-quantity="{ item }">
      <div class="text-sm text-gray-900 dark:text-white">
        {{ item.quantity || 0 }}
      </div>
    </template>

    <!-- Custom cell for status -->
    <template #cell-status="{ item }">
      <CBadge :variant="getStatusBadgeVariant(item)">
        {{
          item.active ? t('admin.tickets.active') : t('admin.tickets.inactive')
        }}
      </CBadge>
    </template>

    <!-- Custom cell for sale period -->
    <template #cell-sale_period="{ item }">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ formatDateRange(item.saleFrom, item.saleUntil) }}
      </div>
    </template>

    <!-- Custom cell for valid period -->
    <template #cell-valid_period="{ item }">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ formatDateRange(item.validFrom, item.validUntil) }}
      </div>
    </template>

    <!-- Actions slot -->
    <template #actions="{ item }">
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 transition-colors"
          :aria-label="t('common.view')"
          :title="t('common.view')"
          @click="emit('view', item)"
        >
          <IconEye class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          :aria-label="t('common.edit')"
          :title="t('common.edit')"
          @click="emit('edit', item)"
        >
          <IconEdit class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
          :aria-label="t('common.delete')"
          :title="t('common.delete')"
          @click="emit('delete', item)"
        >
          <IconTrash class="h-5 w-5" />
        </button>
      </div>
    </template>
  </DataTable>
</template>
