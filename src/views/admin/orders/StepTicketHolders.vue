<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CInput from '@/components/CInput.vue'
import type { HolderEntry } from './createOrder.types'

export type { HolderEntry }

const props = defineProps<{
  holders: HolderEntry[]
}>()

const emit = defineEmits<{
  'update:holders': [value: HolderEntry[]]
}>()

const { t } = useI18n()

function updateHolder(index: number, field: 'name' | 'email', value: string): void {
  const updated = props.holders.map((h, i) =>
    i === index ? { ...h, [field]: value } : h,
  )
  emit('update:holders', updated)
}

function holderSlotLabel(index: number): string {
  const entry = props.holders[index]
  const sameTicketCount = props.holders.filter(
    (h) => h.ticketId === entry.ticketId,
  ).length
  if (sameTicketCount === 1) return entry.ticketLabel
  const slotNumber =
    props.holders
      .slice(0, index + 1)
      .filter((h) => h.ticketId === entry.ticketId).length
  return `${entry.ticketLabel} (${slotNumber}/${sameTicketCount})`
}
</script>

<template>
  <div class="space-y-4">
    <h3
      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
    >
      {{ t('admin.orders.create.holdersSection') }}
    </h3>

    <div
      v-for="(holder, index) in holders"
      :key="index"
      class="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 space-y-3"
    >
      <p class="text-xs font-medium text-indigo-600 dark:text-indigo-400">
        {{ holderSlotLabel(index) }}
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CInput
          :id="`holder-name-${index}`"
          :model-value="holder.name"
          :label="t('admin.orders.create.holderName')"
          type="text"
          @update:model-value="updateHolder(index, 'name', $event)"
        />
        <CInput
          :id="`holder-email-${index}`"
          :model-value="holder.email"
          :label="t('admin.orders.create.holderEmail')"
          type="email"
          @update:model-value="updateHolder(index, 'email', $event)"
        />
      </div>
    </div>
  </div>
</template>