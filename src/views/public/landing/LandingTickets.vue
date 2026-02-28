<script setup lang="ts">
import {
  IconCalendar,
  IconBooks,
  IconTrophy,
  IconPlus,
  IconMinus,
  IconShoppingBagPlus,
  IconShoppingBag,
} from '@tabler/icons-vue'
import type { Ticket } from '@/features/tickets/ticket.model.ts'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/price.ts'
import { useCart } from '@/stores/cart.store'

const { t, locale } = useI18n()
const { getQuantity, addToCart, increaseQuantity, decreaseQuantity } = useCart()

interface Props {
  tickets: Ticket[]
  isLibraryEnabled: boolean
  isTournamentsEnabled: boolean
}

defineProps<Props>()

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'

  return DateTime.fromISO(dateStr).toLocaleString(
    { month: 'long', day: 'numeric' },
    { locale: locale.value },
  )
}

const formatDateRange = (from: string, until: string): string => {
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
  <section id="tickets" class="relative overflow-hidden py-32">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/50 to-white dark:from-gray-950 dark:via-indigo-950/30 dark:to-gray-950"
    />
    <div
      class="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/40 dark:bg-indigo-600/30 blur-3xl"
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
      <div class="mt-16 grid gap-8 lg:grid-cols-3">
        <div
          v-for="(ticket, index) in tickets"
          :key="ticket.id"
          :class="[
            'relative overflow-hidden rounded-3xl p-8 transition-all duration-300',
            index === 1
              ? 'bg-gradient-to-b from-indigo-600 to-violet-700 ring-2 ring-indigo-400 lg:scale-105 shadow-2xl'
              : 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none hover:ring-indigo-300 dark:hover:ring-white/20 hover:shadow-xl',
          ]"
        >
          <!-- Popular Badge -->
          <div
            v-if="index === 1"
            class="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
          >
            {{ t('landing.tickets.popular') }}
          </div>

          <!-- Content -->
          <div>
            <h3
              :class="[
                'text-xl font-semibold',
                index === 1 ? 'text-white' : 'text-gray-900 dark:text-white',
              ]"
            >
              {{ ticket.name }}
            </h3>

            <div class="mt-4 flex items-baseline gap-1">
              <span
                :class="[
                  'text-5xl font-bold tracking-tight',
                  index === 1 ? 'text-white' : 'text-gray-900 dark:text-white',
                ]"
              >
                {{ formatPrice(ticket.price) }}
              </span>
            </div>

            <ul
              :class="[
                'mt-8 space-y-3 text-sm',
                index === 1
                  ? 'text-indigo-100'
                  : 'text-gray-600 dark:text-gray-400',
              ]"
            >
              <li class="flex items-center gap-3">
                <IconCalendar class="h-4 w-4 flex-shrink-0" />
                <span>{{
                  formatDateRange(ticket.valid_from, ticket.valid_until)
                }}</span>
              </li>
              <li v-if="isLibraryEnabled" class="flex items-center gap-3">
                <IconBooks class="h-4 w-4 flex-shrink-0" />
                <span>{{ t('landing.tickets.libraryAccess') }}</span>
              </li>
              <li v-if="isTournamentsEnabled" class="flex items-center gap-3">
                <IconTrophy class="h-4 w-4 flex-shrink-0" />
                <span>{{ t('landing.tickets.tournamentAccess') }}</span>
              </li>
            </ul>

            <button
              v-if="getQuantity(ticket.id) === 0"
              type="button"
              :class="[
                'mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300',
                index === 1
                  ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
              ]"
              @click="addToCart(ticket)"
            >
              <IconShoppingBagPlus class="h-5 w-5" />
              {{ t('landing.tickets.getTicket') }}
            </button>

            <!-- Quantity controls when ticket is in cart -->
            <div
              v-else
              :class="[
                'mt-8 flex w-full items-center justify-center gap-3',
                index === 1 ? '' : '',
              ]"
            >
              <IconShoppingBag
                :class="[
                  'h-5 w-5',
                  index === 1
                    ? 'text-white'
                    : 'text-indigo-600 dark:text-indigo-400',
                ]"
              />
              <button
                type="button"
                :class="[
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                  index === 1
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
                ]"
                @click="decreaseQuantity(ticket.id)"
              >
                <IconMinus class="h-4 w-4" />
              </button>
              <span
                :class="[
                  'min-w-[2rem] text-center text-lg font-semibold',
                  index === 1 ? 'text-white' : 'text-gray-900 dark:text-white',
                ]"
              >
                {{ getQuantity(ticket.id) }}
              </span>
              <button
                type="button"
                :class="[
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                  index === 1
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
                ]"
                @click="increaseQuantity(ticket.id)"
              >
                <IconPlus class="h-4 w-4" />
              </button>
            </div>

            <!-- Total amount for ticket in cart -->
            <p
              v-if="getQuantity(ticket.id) > 0"
              :class="[
                'mt-3 text-center text-sm font-medium',
                index === 1
                  ? 'text-indigo-100'
                  : 'text-gray-600 dark:text-gray-400',
              ]"
            >
              {{ t('landing.tickets.total') }}:
              <span
                :class="[
                  'font-semibold',
                  index === 1 ? 'text-white' : 'text-gray-900 dark:text-white',
                ]"
              >
                {{ formatPrice(ticket.price * getQuantity(ticket.id)) }}
              </span>
            </p>
          </div>

          <!-- Low stock warning -->
          <p
            v-if="ticket.quantity && ticket.quantity < 50"
            :class="[
              'mt-4 text-center text-xs',
              index === 1
                ? 'text-indigo-200'
                : 'text-amber-600 dark:text-amber-400',
            ]"
          >
            {{ t('landing.tickets.ticketsLeft', { count: ticket.quantity }) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
