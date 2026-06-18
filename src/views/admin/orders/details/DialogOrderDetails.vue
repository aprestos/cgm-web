<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { IconX } from '@tabler/icons-vue'
import type { Order } from '@/features/orders/order.model.ts'
import orderService from '@/features/orders/service.ts'
import logger from '@/lib/logger.ts'
import { shortId } from '@/utils/order.ts'
import { formatPrice } from '@/utils/price.ts'

const props = defineProps<{
  open: boolean
  orderId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()

const order = ref<Order | null>(null)
const loading = ref(false)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.orderId) {
      loading.value = true
      order.value = null
      try {
        order.value = await orderService.getOrder(props.orderId)
      } catch (error) {
        logger.error('Failed to load order details', { error })
      } finally {
        loading.value = false
      }
    }
  },
)

function formatPlacedAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} · ${time}`
}

function getStatusBadgeClass(status: string): string {
  if (status === 'paid')
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (status === 'placed')
    return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (status === 'canceled' || status === 'failed')
    return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
}

function getStatusDotClass(status: string): string {
  if (status === 'paid') return 'bg-emerald-500'
  if (status === 'placed') return 'bg-yellow-500'
  if (status === 'canceled' || status === 'failed') return 'bg-red-500'
  return 'bg-gray-400'
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

const totalTicketCount = computed(
  () => order.value?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
)

const ticketInfoMap = computed(() => {
  const map = new Map<
    number,
    { group: string; validFrom: string; validUntil: string }
  >()
  for (const item of order.value?.items ?? []) {
    if (item.ticket) map.set(item.ticket_id, item.ticket)
  }
  return map
})

const GROUP_COLORS = [
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
]

const groupColorMap = computed(() => {
  const groups = [
    ...new Set(
      (order.value?.items ?? [])
        .map((i) => i.ticket?.group)
        .filter((g): g is string => !!g),
    ),
  ]
  const map = new Map<string, string>()
  groups.forEach((g, i) => map.set(g, GROUP_COLORS[i % GROUP_COLORS.length]))
  return map
})

function groupTagColor(group?: string): string {
  if (!group) return GROUP_COLORS[0]
  return groupColorMap.value.get(group) ?? GROUP_COLORS[0]
}

function ticketGroupShortLabel(group?: string): string {
  if (!group) return '—'
  const key = `admin.tickets.${group}`
  const translated = t(key)
  const label = translated === key ? group : translated
  return label.slice(0, 3).toUpperCase()
}

const buyerInitials = computed<string>(() => {
  const name = order.value?.customer?.name
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <TransitionRoot as="template" :show="props.open">
    <Dialog class="relative z-[100]" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/70 dark:bg-gray-900/80 backdrop-blur-sm"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 grid place-items-center p-4">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden"
          >
            <!-- Loading skeleton -->
            <div
              v-if="loading"
              class="flex-1 p-6 space-y-5 animate-pulse overflow-hidden"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <div class="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div class="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
              <div class="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div class="space-y-2">
                <div class="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div class="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
              <div class="space-y-2">
                <div class="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div class="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div class="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div class="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <template v-else-if="order">
              <!-- Header -->
              <div
                class="flex-none px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <h2
                        class="font-display text-xl font-bold text-gray-900 dark:text-white"
                      >
                        {{ t('admin.orders.orderNumber') }}{{ shortId(order.id) }}
                      </h2>
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        :class="getStatusBadgeClass(order.status)"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          :class="getStatusDotClass(order.status)"
                        />
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </div>
                    <p
                      v-if="order.created_at"
                      class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ t('admin.orders.placedAt') }} {{ formatPlacedAt(order.created_at) }}
                    </p>
                  </div>
                  <button
                    class="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    @click="emit('close')"
                  >
                    <IconX class="h-5 w-5" />
                  </button>
                </div>

                <!-- Quick facts -->
                <div
                  class="mt-4 grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/10 rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-100 dark:ring-white/10"
                >
                  <div class="px-4 py-2.5">
                    <p
                      class="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      {{ t('admin.orders.tickets') }}
                    </p>
                    <p
                      class="font-display text-base font-bold tabular-nums text-gray-900 dark:text-white"
                    >
                      {{ totalTicketCount }}
                    </p>
                  </div>
                  <div class="px-4 py-2.5">
                    <p
                      class="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      {{ t('admin.orders.payment') }}
                    </p>
                    <p
                      class="text-base font-bold text-gray-900 dark:text-white"
                    >
                      {{ order.stripe_session_id ? 'Stripe' : t('admin.orders.paymentCash') }}
                    </p>
                  </div>
                  <div class="px-4 py-2.5">
                    <p
                      class="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      {{ t('admin.orders.total') }}
                    </p>
                    <p
                      class="font-display text-base font-bold tabular-nums text-gray-900 dark:text-white"
                    >
                      {{ formatPrice(order.total) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Scrollable body -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <!-- Customer -->
                <section v-if="order.customer">
                  <h3
                    class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2"
                  >
                    {{ t('admin.orders.buyer') }}
                  </h3>
                  <div
                    class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 p-3"
                  >
                    <div
                      class="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-display font-semibold text-sm shrink-0 select-none"
                    >
                      {{ buyerInitials }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p
                        class="text-sm font-semibold text-gray-900 dark:text-white truncate"
                      >
                        {{ order.customer.name }}
                      </p>
                      <p
                        class="text-sm font-semibold text-gray-400 dark:text-gray-400 truncate"
                      >
                        {{ order.customer.email }}
                      </p>
                    </div>
                  </div>
                </section>

                <!-- Tickets — issuances (one row per issued ticket) -->
                <section v-if="order.issuances.length > 0">
                  <h3
                    class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2"
                  >
                    {{ t('admin.orders.tickets') }} · {{ totalTicketCount }}
                  </h3>
                  <div class="space-y-2">
                    <div
                      v-for="issuance in order.issuances"
                      :key="`${issuance.ticket_id}-${issuance.recipient_email}`"
                      class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 p-3"
                    >
                      <span
                        class="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 shrink-0"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="1.8"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"
                          />
                        </svg>
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            {{ issuance.recipient_name }}
                          </p>
                          <span
                            v-if="ticketInfoMap.get(issuance.ticket_id)"
                            class="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                            :class="
                              groupTagColor(
                                ticketInfoMap.get(issuance.ticket_id)?.group,
                              )
                            "
                          >
                            {{
                              ticketGroupShortLabel(
                                ticketInfoMap.get(issuance.ticket_id)?.group,
                              )
                            }}
                          </span>
                        </div>
                        <p
                          class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate"
                        >
                          {{ issuance.recipient_email }}
                        </p>
                      </div>
                      <span
                        class="shrink-0 inline-flex rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        {{ t('admin.orders.ticketValid') }}
                      </span>
                    </div>
                  </div>
                </section>

                <!-- Tickets — items (when no issuances exist) -->
                <section v-else-if="order.items.length > 0">
                  <h3
                    class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2"
                  >
                    {{ t('admin.orders.tickets') }} · {{ totalTicketCount }}
                  </h3>
                  <div class="space-y-2">
                    <div
                      v-for="item in order.items"
                      :key="item.ticket_id"
                      class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 p-3"
                    >
                      <span
                        class="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 shrink-0"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="1.8"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"
                          />
                        </svg>
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span
                            v-if="item.ticket?.group"
                            class="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                            :class="groupTagColor(item.ticket.group)"
                          >
                            {{ ticketGroupShortLabel(item.ticket.group) }}
                          </span>
                        </div>
                      </div>
                      <span
                        class="shrink-0 text-sm font-semibold text-gray-900 dark:text-white tabular-nums"
                      >
                        × {{ item.quantity }}
                      </span>
                    </div>
                  </div>
                </section>

                <!-- Payment -->
                <section>
                  <h3
                    class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2"
                  >
                    {{ t('admin.orders.payment') }}
                  </h3>
                  <div
                    class="rounded-xl border border-gray-200 dark:border-white/10 p-4 text-sm"
                  >
                    <div class="flex justify-between">
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ t('admin.orders.totalPaid') }}
                      </span>
                      <span
                        class="font-display text-base font-bold tabular-nums text-gray-900 dark:text-white"
                      >
                        {{ formatPrice(order.total) }}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Footer actions -->
              <div
                class="hidden flex-none items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5"
              >
                <button
                  class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 6h16v12H4zM4 7l8 6 8-6"
                    />
                  </svg>
                  {{ t('admin.orders.resendTickets') }}
                </button>
                <div class="flex items-center gap-2">
                  <button
                    class="rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    {{ t('admin.orders.refund') }}
                  </button>
                  <button
                    class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
                  >
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {{ t('admin.orders.checkInAll') }}
                  </button>
                </div>
              </div>
            </template>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
