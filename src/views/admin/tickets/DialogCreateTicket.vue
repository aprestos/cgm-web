<template>
  <DialogComponent
    :open="open"
    :title="t('admin.tickets.createTicket')"
    size="md"
    @close="emit('close')"
  >
    <form>
      <div class="space-y-6 mx-auto max-w-7xl">
        <!-- Common fields (render once) -->
        <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <CInput
            id="ticket-name"
            v-model="formData.name"
            :label="t('admin.tickets.name')"
            :errors="r$.$errors.name"
          />

          <CInputCurrency
            id="ticket-price"
            v-model="formData.price"
            :label="t('admin.tickets.price')"
            :errors="r$.$errors.price"
          />

          <CInput
            id="ticket-quantity"
            v-model="formData.quantity"
            :label="t('admin.tickets.quantity')"
            type="number"
            :errors="r$.$errors.quantity"
          />

          <!-- Sale Period: side-by-side grid for start and end -->
          <div class="sm:col-span-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <CInput
                id="ticket-sale-from"
                v-model="formData.sale_from"
                :label="t('admin.tickets.saleFrom')"
                type="datetime-local"
                :errors="r$.$errors.sale_from"
                :helper-text="t('admin.tickets.optional')"
                class="col-span-full sm:col-span-1"
              />

              <CInput
                id="ticket-sale-until"
                v-model="formData.sale_until"
                :label="t('admin.tickets.saleUntil')"
                type="datetime-local"
                :errors="r$.$errors.sale_until"
                :helper-text="t('admin.tickets.optional')"
                class="col-span-full sm:col-span-1"
              />
            </div>
          </div>
        </div>

        <!-- FormTabs for Single Day vs Multiple Days (only validity fields inside) -->
        <FormTabs
          v-model="selectedTab"
          :tabs="tabs"
          @tab-change="handleTabChange"
        >
          <!-- Tab 0: Single Day Ticket -->
          <template #tab-0>
            <div class="grid grid-cols-1 gap-x-6 gap-y-8">
              <CInput
                id="ticket-valid-date"
                v-model="formData.valid_from"
                :label="t('admin.tickets.accessDay')"
                type="date"
                :errors="r$.$errors.valid_from"
                :min="
                  editionStore?.start_date
                    ? DateTime.fromISO(editionStore?.start_date).toFormat(
                        'yyyy-MM-dd',
                      )
                    : ''
                "
              />
            </div>
          </template>

          <!-- Tab 1: Multiple Days Ticket -->
          <template #tab-1>
            <div class="grid grid-cols-2 gap-x-6 gap-y-8">
              <CInput
                id="ticket-valid-from-multi"
                v-model="formData.valid_from"
                :label="t('admin.tickets.validFrom')"
                type="date"
                :errors="r$.$errors.valid_from"
                class="col-span-full sm:col-span-1"
              />

              <CInput
                id="ticket-valid-until-multi"
                v-model="formData.valid_until"
                :label="t('admin.tickets.validUntil')"
                type="date"
                :errors="r$.$errors.valid_until"
                class="col-span-full sm:col-span-1"
              />
            </div>
          </template>
        </FormTabs>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </CButton>
        <CButton
          type="button"
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('admin.tickets.submitting')"
          @click="submit"
        >
          {{ t('admin.tickets.submit') }}
        </CButton>
      </div>
    </form>
  </DialogComponent>
</template>

<script lang="ts" setup>
import { useRegle } from '@regle/core'
import { required, requiredIf, minValue, dateAfter } from '@regle/rules'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { IconCalendar, IconCalendarEvent } from '@tabler/icons-vue'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CInputCurrency from '@/components/CInputCurrency.vue'
import FormTabs from '@/components/FormTabs.vue'
import type { TabConfig } from '@/components/FormTabs.vue'
import ticketService from '@/features/tickets/service'
import type { TicketGroup } from '@/features/tickets/ticket.model'
import { tenantStore } from '@/stores/tenant'
import { editionStore } from '@/stores/edition'
import logger from '@/lib/logger'
import { DateTime } from 'luxon'

const { t } = useI18n()

interface Props {
  open: boolean
  group?: TicketGroup
}

const props = defineProps<Props>()

const formData = ref<{
  name: string
  price: string
  quantity: string
  sale_from: string
  sale_until: string
  valid_from: string
  valid_until: string
}>({
  name: '',
  price: '',
  quantity: '',
  sale_from: '',
  sale_until: '',
  valid_from: '',
  valid_until: '',
})

const isSubmitting = ref<boolean>(false)
const selectedTab = ref<number>(0)

const emit = defineEmits<{
  close: []
  created: []
}>()

const tabs = computed<TabConfig[]>(() => [
  {
    label: t('admin.tickets.singleDay'),
    icon: IconCalendar,
  },
  {
    label: t('admin.tickets.multipleDays'),
    icon: IconCalendarEvent,
  },
])

const handleTabChange = (index: number): void => {
  selectedTab.value = index
  // Clear valid_until when switching to single day
  if (index === 0) {
    formData.value.valid_until = ''
  }
}

const { r$ } = useRegle(formData, {
  name: { required },
  price: { required, minValue: minValue(0) },
  quantity: { required, minValue: minValue(1) },
  valid_from: {
    required,
    dateAfter: dateAfter(DateTime.local().startOf('day').toJSDate()),
  },
  valid_until: {
    required: requiredIf(() => selectedTab.value === 1),
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
    // must be after valid from, to be implemented later
  },
  sale_from: {
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
  },
  sale_until: {
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
    // must be after sale from, to be implemented later
  },
})

const resetForm = (): void => {
  formData.value = {
    name: '',
    price: '',
    quantity: '',
    sale_from: '',
    sale_until: '',
    valid_from: '',
    valid_until: '',
  }
  r$.$reset()
}

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  // Validate form before submitting
  const { valid } = await r$.$validate()

  if (!valid) {
    logger.debug('Form has validation errors', r$.$errors)
    return
  }

  if (!tenantStore.value?.id || !editionStore.value?.id) {
    toast.error(t('admin.tickets.missingTenantOrEdition'))
    return
  }

  isSubmitting.value = true

  let validFrom: DateTime | null
  let validUntil: DateTime | null

  validFrom = DateTime.fromISO(formData.value.valid_from).setZone(
    editionStore.value.timezone,
  )

  // For single day tickets, set valid_until to the end of the valid_from day
  validUntil = DateTime.fromISO(
    selectedTab.value === 0
      ? formData.value.valid_from
      : formData.value.valid_until,
  ).setZone(editionStore.value.timezone)

  if (!validUntil || !validFrom) return

  validFrom = validFrom.startOf('day')
  validUntil = validUntil.endOf('day')

  try {
    await ticketService.create({
      tenant_id: tenantStore.value.id,
      edition_id: editionStore.value.id,
      name: formData.value.name,
      price: parseFloat(formData.value.price),
      group: props.group as TicketGroup,
      quantity: parseInt(formData.value.quantity, 10),
      active: true,
      sale_from: formData.value.sale_from || undefined,
      sale_until: formData.value.sale_until || undefined,
      valid_from: validFrom.toISO() as string,
      valid_until: validUntil.toISO() as string,
    })

    toast.success(t('admin.tickets.createSuccess'))

    resetForm()

    // Emit events
    emit('created')
    emit('close')
  } catch {
    toast.error(t('admin.tickets.createFailed'))
  } finally {
    isSubmitting.value = false
  }
}

// Expose the submit function so parent components can call it
defineExpose({
  submit,
})
</script>
