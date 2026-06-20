<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import ticketService from '@/features/tickets/service'
import orderService from '@/features/orders/service'
import type { Ticket } from '@/features/tickets/ticket.model'
import { tenantStore } from '@/stores/tenant'
import { editionStore } from '@/stores/edition'
import { formatRange } from '@/utils/date'
import logger from '@/lib/logger'
import StepSelectTickets from './StepSelectTickets.vue'
import StepTicketHolders from './StepTicketHolders.vue'
import type { HolderEntry } from './createOrder.types'
import { userService } from '@/features/users/service.ts'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const { t, locale } = useI18n()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const step = ref<1 | 2>(1)
const tickets = ref<Ticket[]>([])
const quantities = ref<Map<number, number>>(new Map())
const loadingTickets = ref(false)
const submitting = ref(false)
const buyerEmail = ref('')
const holders = ref<HolderEntry[]>([])

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    step.value = 1
    quantities.value = new Map()
    buyerEmail.value = ''
    holders.value = []
    loadingTickets.value = true
    try {
      if (tenantStore.value?.id && editionStore.value?.id) {
        const all = await ticketService.get(
          tenantStore.value.id,
          editionStore.value.id,
        )
        tickets.value = all.filter((tk) => tk.active)
      }
    } catch (error) {
      logger.error('Failed to load tickets for order creation', { error })
      toast.error(t('admin.orders.create.loadTicketsFailed'))
    } finally {
      loadingTickets.value = false
    }
  },
)

function groupLabel(ticket: Ticket): string {
  return t(`admin.tickets.${ticket.group}`)
}

function ticketLabel(ticket: Ticket): string {
  return `${groupLabel(ticket)} · ${formatRange(ticket.validFrom, ticket.validUntil, locale.value)}`
}

const selectedTickets = computed(() =>
  tickets.value.filter((tk) => (quantities.value.get(tk.id) ?? 0) > 0),
)

const canAdvance = computed(
  () =>
    selectedTickets.value.length > 0 &&
    EMAIL_REGEX.test(buyerEmail.value.trim()),
)

const canSubmit = computed(
  () =>
    holders.value.length > 0 &&
    holders.value.every((h) => h.name.trim() !== '' && h.email.trim() !== ''),
)

function goToStep2(): void {
  holders.value = selectedTickets.value.flatMap((tk) => {
    const qty = quantities.value.get(tk.id) ?? 0
    const label = ticketLabel(tk)
    return Array.from({ length: qty }, () => ({
      ticketId: tk.id,
      ticketLabel: label,
      name: '',
      email: buyerEmail.value.trim(),
    }))
  })
  step.value = 2
}

async function submit(): Promise<void> {
  if (submitting.value || !canSubmit.value) return
  submitting.value = true
  try {
    const items = selectedTickets.value.map((tk) => ({
      ticketId: tk.id,
      quantity: quantities.value.get(tk.id)!,
      title: ticketLabel(tk),
    }))

    const issuances = holders.value.map((h) => ({
      ticketId: h.ticketId,
      recipientName: h.name.trim(),
      recipientEmail: h.email.trim(),
    }))

    let user = await userService.getByEmail(buyerEmail.value.trim())
    if (!user) {
      user = await userService.create(null, buyerEmail.value.trim())
    }

    await orderService.create({
      customerId: user.id,
      currency: editionStore.value?.currency ?? 'EUR',
      items,
      issuances,
      payment: {
        type: 'cash',
      },
    })
    toast.success(t('admin.orders.create.success'))
    emit('created')
    emit('close')
  } catch (error) {
    logger.error('Failed to create order', { error })
    toast.error(t('admin.orders.create.failed'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DialogComponent
    :open="open"
    :title="t('admin.orders.create.title')"
    size="md"
    @close="emit('close')"
  >
    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-6">
      <div v-for="n in 2" :key="n" class="flex items-center gap-2">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors"
          :class="
            n === step
              ? 'bg-indigo-600 text-white'
              : n < step
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'
          "
        >
          {{ n }}
        </div>
        <span
          class="text-xs font-medium transition-colors"
          :class="
            n === step
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-gray-500'
          "
        >
          {{
            n === 1
              ? t('admin.orders.create.stepTickets')
              : t('admin.orders.create.stepHolders')
          }}
        </span>
        <div v-if="n < 2" class="h-px w-6 bg-gray-200 dark:bg-white/10" />
      </div>
    </div>

    <StepSelectTickets
      v-if="step === 1"
      :tickets="tickets"
      :loading-tickets="loadingTickets"
      :quantities="quantities"
      :buyer-email="buyerEmail"
      @update:quantities="quantities = $event"
      @update:buyer-email="buyerEmail = $event"
    />

    <StepTicketHolders
      v-else
      :holders="holders"
      @update:holders="holders = $event"
    />

    <!-- Actions -->
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <CButton
        v-if="step === 1"
        type="button"
        variant="secondary"
        size="lg"
        class="w-full sm:w-auto"
        @click="emit('close')"
      >
        {{ t('common.cancel') }}
      </CButton>
      <CButton
        v-else
        type="button"
        variant="secondary"
        size="lg"
        class="w-full sm:w-auto"
        @click="step = 1"
      >
        {{ t('admin.orders.create.back') }}
      </CButton>

      <CButton
        v-if="step === 1"
        type="button"
        variant="primary"
        size="lg"
        class="w-full sm:w-auto"
        :disabled="!canAdvance"
        @click="goToStep2"
      >
        {{ t('admin.orders.create.next') }}
      </CButton>
      <CButton
        v-else
        type="button"
        variant="primary"
        size="lg"
        class="w-full sm:w-auto"
        :disabled="!canSubmit"
        :loading="submitting"
        :loading-text="t('admin.orders.create.submitting')"
        @click="submit"
      >
        {{ t('admin.orders.create.submit') }}
      </CButton>
    </div>
  </DialogComponent>
</template>
