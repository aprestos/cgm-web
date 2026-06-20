<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconMinus, IconPlus, IconTicket } from '@tabler/icons-vue'
import CInput from '@/components/CInput.vue'
import type { Ticket } from '@/features/tickets/ticket.model'
import { formatPrice } from '@/utils/price'
import { formatRange } from '@/utils/date'

const props = defineProps<{
  tickets: Ticket[]
  loadingTickets: boolean
  quantities: Map<number, number>
  buyerEmail: string
}>()

const emit = defineEmits<{
  'update:quantities': [value: Map<number, number>]
  'update:buyerEmail': [value: string]
}>()

const { t, locale } = useI18n()

const emailTouched = ref(false)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailErrors = computed<string[]>(() => {
  if (!emailTouched.value || props.buyerEmail.trim() === '') return []
  return EMAIL_REGEX.test(props.buyerEmail.trim())
    ? []
    : [t('admin.orders.create.emailInvalid')]
})

function getQty(ticketId: number): number {
  return props.quantities.get(ticketId) ?? 0
}

function increment(ticket: Ticket): void {
  const current = getQty(ticket.id)
  if (current < ticket.quantity) {
    emit(
      'update:quantities',
      new Map(props.quantities).set(ticket.id, current + 1),
    )
  }
}

function decrement(ticketId: number): void {
  const current = getQty(ticketId)
  if (current > 0) {
    emit(
      'update:quantities',
      new Map(props.quantities).set(ticketId, current - 1),
    )
  }
}

const total = computed(() =>
  props.tickets.reduce((sum, tk) => sum + tk.price * getQty(tk.id), 0),
)

function groupLabel(ticket: Ticket): string {
  return t(`admin.tickets.${ticket.group}`)
}

function validityLabel(ticket: Ticket): string {
  return formatRange(ticket.validFrom, ticket.validUntil, locale.value)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Buyer -->
    <section>
      <h3
        class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3"
      >
        {{ t('admin.orders.create.customerSection') }}
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CInput
          id="buyer-email"
          :model-value="buyerEmail"
          :label="t('admin.orders.create.buyerEmail')"
          type="email"
          :errors="emailErrors"
          @update:model-value="emit('update:buyerEmail', $event)"
          @blur="emailTouched = true"
        />
      </div>
    </section>

    <!-- Tickets -->
    <section>
      <h3
        class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3"
      >
        {{ t('admin.orders.create.ticketsSection') }}
      </h3>

      <!-- Loading skeleton -->
      <div v-if="loadingTickets" class="space-y-2 animate-pulse">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 rounded-xl bg-gray-100 dark:bg-gray-700"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="tickets.length === 0"
        class="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700"
      >
        <IconTicket
          class="size-9 text-gray-300 dark:text-gray-600"
          stroke="1.5"
        />
        <p class="mt-2 text-sm text-gray-400 dark:text-gray-500">
          {{ t('admin.orders.create.noTickets') }}
        </p>
      </div>

      <!-- Ticket rows -->
      <div v-else class="space-y-2">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
          :class="
            getQty(ticket.id) > 0
              ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-700/50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-white/10'
          "
        >
          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                {{ groupLabel(ticket) }}
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ validityLabel(ticket) }}
              </span>
            </div>
            <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {{ formatPrice(ticket.price) }}
              &nbsp;·&nbsp;
              {{ ticket.quantity }}
              {{ t('admin.orders.create.available') }}
            </p>
          </div>

          <!-- Quantity stepper -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              class="grid cursor-pointer h-8 w-8 place-items-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              :disabled="getQty(ticket.id) === 0"
              @click="decrement(ticket.id)"
            >
              <IconMinus class="h-3.5 w-3.5" />
            </button>
            <span
              class="w-6 text-center text-sm font-semibold tabular-nums text-gray-900 dark:text-white"
            >
              {{ getQty(ticket.id) }}
            </span>
            <button
              type="button"
              class="grid cursor-pointer h-8 w-8 place-items-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              :disabled="getQty(ticket.id) >= ticket.quantity"
              @click="increment(ticket)"
            >
              <IconPlus class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Total -->
    <div
      class="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3"
    >
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ t('admin.orders.total') }}
      </span>
      <span
        class="font-display text-lg font-bold tabular-nums text-gray-900 dark:text-white"
      >
        {{ formatPrice(total) }}
      </span>
    </div>
  </div>
</template>
