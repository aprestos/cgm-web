<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CartItem } from '@/stores/cart.store'
import { formatPrice } from '@/utils/price'
import { formatWeekday } from '@/utils/date.ts'

interface Props {
  items: CartItem[]
  total: number
}

defineProps<Props>()

const { t, locale } = useI18n()
</script>

<template>
  <aside
    class="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-6 lg:sticky lg:top-24"
  >
    <h2 class="text-lg font-semibold">
      {{ t('checkout.section.summary') }}
    </h2>

    <ul class="mt-4 space-y-3">
      <li
        v-for="item in items"
        :key="item.ticket.id"
        class="flex items-start justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950"
      >
        <div>
          <p class="text-sm font-medium">
            {{
              formatWeekday(
                item.ticket.validFrom,
                item.ticket.validUntil,
                locale,
              )
            }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('checkout.summary.quantity', { count: item.quantity }) }}
          </p>
        </div>
        <p class="text-sm font-semibold">
          {{ formatPrice(item.ticket.price * item.quantity) }}
        </p>
      </li>
    </ul>

    <dl
      class="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-white/10"
    >
      <div
        class="flex items-center justify-between pt-2 text-base font-semibold text-gray-900 dark:text-white"
      >
        <dt>{{ t('checkout.summary.total') }}</dt>
        <dd>{{ formatPrice(total) }}</dd>
      </div>
    </dl>
  </aside>
</template>
