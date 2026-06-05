<script setup lang="ts">
import { IconCheck } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/price'
import { RouteNames } from '@/router/routeNames.ts'
import type { TicketAttendee } from '@/views/landing/checkout/checkout.model.ts'

interface Props {
  orderId: string | undefined
  attendees: Array<TicketAttendee> | undefined
  total: number
}

defineProps<Props>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-5">
    <div
      class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/40 dark:bg-emerald-500/10"
    >
      <p
        class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
      >
        <IconCheck class="size-4" />
        {{ t('checkout.completed.success') }}
      </p>
      <h2
        class="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100"
      >
        {{ t('checkout.completed.title') }}
      </h2>
      <p class="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
        {{ t('checkout.completed.description') }}
      </p>
    </div>

    <div
      class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-950"
    >
      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ t('checkout.completed.reference') }}:
        <span class="font-semibold text-gray-900 dark:text-white">{{
          orderId
        }}</span>
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {{ t('checkout.completed.total') }}:
        <span class="font-semibold text-gray-900 dark:text-white">{{
          formatPrice(total)
        }}</span>
      </p>
    </div>

    <div>
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {{ t('checkout.completed.attendees') }}
      </h3>
      <ul class="mt-2 space-y-2">
        <li
          v-for="attendee in attendees || []"
          :key="attendee.key"
          class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950"
        >
          <span class="font-medium">{{ attendee.ticketName }}</span>
          <span class="mx-1 text-gray-400">-</span>
          <span>{{ attendee.holderName }}</span>
          <span class="mx-1 text-gray-400">|</span>
          <span class="text-gray-600 dark:text-gray-300">{{
            attendee.holderEmail
          }}</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row">
      <RouterLink
        class="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
        :to="{ name: RouteNames.landing.home }"
      >
        {{ t('checkout.completed.backHome') }}
      </RouterLink>
      <RouterLink
        class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        :to="{ name: RouteNames.landing.home, hash: '#tickets' }"
      >
        {{ t('checkout.completed.buyMore') }}
      </RouterLink>
    </div>
  </div>
</template>
