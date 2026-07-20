<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconEdit, IconTicket, IconTrash } from '@tabler/icons-vue'
import type { Ticket } from '@/features/tickets/ticket.model'
import CBadge from '@/components/CBadge.vue'
import { formatPrice } from '@/utils/price'
import { formatDateRange } from '@/utils/date'
import { getTicketTitle } from '@/utils/ticket'

interface Props {
  ticket: Ticket | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [ticket: Ticket]
  delete: [ticket: Ticket]
}>()

const { t, locale } = useI18n()

const title = computed(() =>
  props.ticket
    ? getTicketTitle(
        props.ticket.accessDays,
        locale.value,
        t('landing.tickets.weekend'),
      )
    : null,
)
</script>

<template>
  <div
    v-if="!ticket"
    class="flex flex-col items-center justify-center py-16 text-center"
  >
    <IconTicket
      class="h-12 w-12 text-gray-400 dark:text-gray-500"
      stroke="1.5"
    />
    <h3 class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
      {{ t('admin.tickets.selectTicketTitle') }}
    </h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ t('admin.tickets.selectTicketDescription') }}
    </p>
  </div>

  <div v-else class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ ticket.name || title?.displayDate }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ title?.displayDate }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          :aria-label="t('common.actions.edit')"
          :title="t('common.actions.edit')"
          @click="emit('edit', ticket)"
        >
          <IconEdit class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
          :aria-label="t('common.actions.delete')"
          :title="t('common.actions.delete')"
          @click="emit('delete', ticket)"
        >
          <IconTrash class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Details grid -->
    <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <dt
          class="text-xs font-medium uppercase text-gray-400 dark:text-gray-500"
        >
          {{ t('admin.tickets.price') }}
        </dt>
        <dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {{ formatPrice(ticket.price) }}
        </dd>
      </div>
      <div>
        <dt
          class="text-xs font-medium uppercase text-gray-400 dark:text-gray-500"
        >
          {{ t('admin.tickets.quantity') }}
        </dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ ticket.quantity || 0 }}
        </dd>
      </div>
      <div>
        <dt
          class="text-xs font-medium uppercase text-gray-400 dark:text-gray-500"
        >
          {{ t('admin.tickets.statusLabel') }}
        </dt>
        <dd class="mt-1">
          <CBadge
            :type="ticket.active ? 'green' : 'gray'"
            size="sm"
            :text="
              ticket.active
                ? t('admin.tickets.status.active')
                : t('admin.tickets.status.inactive')
            "
          />
        </dd>
      </div>
      <div class="sm:col-span-2">
        <dt
          class="text-xs font-medium uppercase text-gray-400 dark:text-gray-500"
        >
          {{ t('admin.tickets.salePeriod') }}
        </dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ formatDateRange(ticket.saleFrom, ticket.saleUntil, locale) }}
        </dd>
      </div>
    </dl>

    <!-- Access days -->
    <div v-if="ticket.accessDays?.length">
      <dt
        class="text-xs font-medium uppercase text-gray-400 dark:text-gray-500"
      >
        {{ t('admin.tickets.accessDays') }}
      </dt>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="day in ticket.accessDays"
          :key="day.day"
          class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
        >
          {{ day.day }}
        </span>
      </div>
    </div>
  </div>
</template>
