<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Ticket } from '@/features/tickets/ticket.model'
import { formatPrice } from '@/utils/price'
import { getTicketTitle } from '@/utils/ticket'
import CBadge from '@/components/CBadge.vue'

interface Props {
  ticket: Ticket
  selected: boolean
}

const props = defineProps<Props>()

const { t, locale } = useI18n()

const title = computed(() =>
  getTicketTitle(
    props.ticket.accessDays,
    locale.value,
    t('landing.tickets.weekend'),
  ),
)
</script>

<template>
  <div class="flex justify-between gap-3 px-4 py-3">
    <div class="min-w-0">
      <p
        class="truncate text-sm font-semibold"
        :class="
          selected
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-gray-900 dark:text-white'
        "
      >
        {{ ticket.name || title.displayDate }}
      </p>
      <p
        v-if="ticket.name"
        class="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {{ title.displayDate }}
      </p>
      <p class="mt-1 text-xs font-medium text-slate-500">
        {{ ticket.accessDays?.length }} days - {{ formatPrice(ticket.price) }}
      </p>
    </div>
    <div class="flex shrink-0 flex-col items-end gap-1">
      <CBadge
        :type="ticket.status === 'active' ? 'green' : 'gray'"
        size="sm"
        :text="t(`admin.tickets.status.${ticket.status}`)"
      />
    </div>
  </div>
</template>
