<script setup lang="ts">
import {
  IconCalendar,
  IconPlus,
  IconMinus,
  IconShoppingBagPlus,
  IconShoppingBag,
  IconArrowRight,
} from '@tabler/icons-vue'
import { computed } from 'vue'
import type { Ticket } from '@/features/tickets/ticket.model.js'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/price.js'
import { useCart } from '@/stores/cart.store'
import { formatDateRange, formatWeekday } from '@/utils/date.js'
import { RouteNames } from '@/router/routeNames.ts'

const { t, locale } = useI18n()
const {
  getQuantity,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  totalItems,
  totalPrice,
} = useCart()

interface Props {
  tickets: Ticket[]
}

defineProps<Props>()

const hasItems = computed(() => totalItems.value > 0)
const formattedTotal = computed(() => formatPrice(totalPrice.value))
</script>

<template>
  <section id="tickets" class="relative overflow-hidden py-32">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-linear-to-b from-white via-indigo-50/50 to-white dark:from-gray-950 dark:via-indigo-950/30 dark:to-gray-950"
    />
    <div
      class="absolute left-0 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/40 dark:bg-indigo-600/30 blur-3xl"
    />

    <div class="relative z-10 mx-auto max-w-5xl px-4">
      <!-- Section Header -->
      <div class="text-center">
        <h2
          class="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
        >
          {{ t('landing.tickets.sectionTitle') }}
        </h2>
        <p
          class="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
        >
          {{ t('landing.tickets.sectionSubtitle') }}
        </p>
      </div>

      <!-- Tickets Grid -->
      <div class="mt-16 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          :class="[
            'relative overflow-hidden rounded-3xl p-8 transition-all duration-300',
            ticket.isPopular
              ? 'bg-linear-to-b from-indigo-600 to-violet-700 ring-2 ring-indigo-400 lg:scale-105 shadow-2xl'
              : 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none hover:ring-indigo-300 dark:hover:ring-white/20 hover:shadow-xl',
          ]"
        >
          <!-- Popular Badge -->
          <div
            v-if="ticket.isPopular"
            class="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
          >
            {{ t('landing.tickets.popular') }}
          </div>

          <!-- Content -->
          <div>
            <h3
              :class="[
                'text-xl font-semibold flex items-center gap-3',
                ticket.isPopular
                  ? 'text-white'
                  : 'text-gray-700 dark:text-white',
              ]"
            >
              <span>{{
                formatWeekday(ticket.validFrom, ticket.validUntil, locale)
              }}</span>
            </h3>
            <div
              :class="[
                'mt-1 flex flex-row items-center text-gray-700 gap-2 dark:text-white/60',
                ticket.isPopular
                  ? 'text-white/80'
                  : 'text-gray-900 dark:text-white',
              ]"
            >
              <IconCalendar class="h-5 w-5 shrink-0" />
              <span>
                {{
                  formatDateRange(ticket.validFrom, ticket.validUntil, locale)
                }}
              </span>
            </div>

            <div class="mt-4 flex items-baseline gap-1">
              <span
                :class="[
                  'text-5xl font-bold tracking-tight',
                  ticket.isPopular
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white',
                ]"
              >
                {{ formatPrice(ticket.price) }}
              </span>
            </div>
            <!-- Action area: add-to-cart button ↔ quantity selector -->
            <div class="mt-8">
              <Transition
                mode="out-in"
                enter-active-class="transition-all duration-300 ease-out motion-reduce:transition-none"
                leave-active-class="transition-all duration-200 ease-in motion-reduce:transition-none"
                enter-from-class="opacity-0 scale-75"
                leave-to-class="opacity-0 scale-75"
              >
                <button
                  v-if="getQuantity(ticket.id) === 0"
                  key="add-btn"
                  type="button"
                  :class="[
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 cursor-pointer',
                    ticket.isPopular
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-gray-100 text-black hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
                  ]"
                  @click="addToCart(ticket)"
                >
                  <IconShoppingBagPlus class="h-5 w-5" />
                  {{ t('landing.tickets.getTicket') }}
                </button>

                <!-- Quantity controls when ticket is in cart -->
                <div
                  v-else
                  key="qty-ctrl"
                  :class="[
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2',
                    ticket.isPopular
                      ? 'bg-white/20'
                      : 'bg-black dark:bg-white/10',
                  ]"
                >
                  <button
                    type="button"
                    :class="[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer',
                      ticket.isPopular
                        ? 'text-white hover:bg-white/20'
                        : 'text-white hover:bg-white/20',
                    ]"
                    @click="decreaseQuantity(ticket.id)"
                  >
                    <IconMinus class="h-4 w-4" />
                  </button>

                  <!-- Quantity number pulses on every change via :key trick -->
                  <Transition
                    mode="out-in"
                    enter-active-class="transition-all duration-150 ease-out motion-reduce:transition-none"
                    leave-active-class="transition-all duration-100 ease-in motion-reduce:transition-none"
                    enter-from-class="opacity-0 scale-50"
                    leave-to-class="opacity-0 scale-50"
                  >
                    <span
                      :key="getQuantity(ticket.id)"
                      class="min-w-8 text-center text-sm font-semibold text-white"
                    >
                      {{ getQuantity(ticket.id) }}
                    </span>
                  </Transition>

                  <button
                    type="button"
                    :class="[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer',
                      ticket.isPopular
                        ? 'text-white hover:bg-white/20'
                        : 'text-white hover:bg-white/20',
                    ]"
                    @click="increaseQuantity(ticket.id)"
                  >
                    <IconPlus class="h-4 w-4" />
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Low stock warning -->
          <p
            v-if="ticket.quantity && ticket.quantity < 50"
            :class="[
              'mt-4 text-center text-xs',
              ticket.isPopular
                ? 'text-indigo-200'
                : 'text-amber-600 dark:text-amber-400',
            ]"
          >
            {{ t('landing.tickets.ticketsLeft', { count: ticket.quantity }) }}
          </p>
        </div>
      </div>
      <!-- Checkout Button -->
      <div class="mt-12 flex h-14 items-center justify-center">
        <Transition
          enter-active-class="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="opacity-0 scale-75 blur-sm"
          enter-to-class="opacity-100 scale-100 blur-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-75"
        >
          <RouterLink
            v-if="hasItems"
            :to="{ name: RouteNames.landing.checkout }"
          >
            <button
              type="button"
              class="group flex cursor-pointer items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/40 dark:shadow-indigo-700/30"
            >
              <IconShoppingBag class="h-5 w-5" />
              <span>
                {{ t('landing.tickets.checkout') }} · {{ formattedTotal }}
              </span>
              <IconArrowRight
                class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </RouterLink>
        </Transition>
      </div>
    </div>
  </section>
</template>
