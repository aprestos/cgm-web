<template>
  <DialogComponent
    :open="open"
    :title="t('admin.tickets.createTicket')"
    size="md"
    @close="emit('close')"
  >
    <form>
      <div class="space-y-6 mx-auto max-w-7xl">
        <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <CInput
            id="ticket-name"
            v-model="formData.name"
            :label="t('admin.tickets.name')"
            :errors="r$.$errors.name"
            class="col-span-full"
          />

          <CInputCurrency
            id="ticket-price"
            v-model="formData.price"
            :label="t('admin.tickets.price')"
            :errors="r$.$errors.price"
          />
        </div>

        <!-- Access Days: multi-select from the edition's pre-defined ticket_days -->
        <div>
          <label
            id="access-days-label"
            class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
          >
            {{ t('admin.tickets.accessDays') }}
          </label>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.tickets.accessDaysHelper') }}
          </p>

          <div
            v-if="loadingDays"
            class="mt-3 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('common.state.loading') }}
          </div>

          <p
            v-else-if="ticketDays.length === 0"
            class="mt-3 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('admin.tickets.noDaysAvailable') }}
          </p>

          <div
            v-else
            class="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-labelledby="access-days-label"
          >
            <button
              v-for="day in ticketDays"
              :key="day.id"
              type="button"
              :aria-pressed="isDaySelected(day.id)"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                isDaySelected(day.id)
                  ? 'bg-primary-600 border-primary-600 text-white dark:bg-primary-700 dark:border-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10',
              ]"
              @click="toggleDay(day.id)"
            >
              <IconCheck v-if="isDaySelected(day.id)" class="size-4" />
              {{ dayLabel(day.day) }}
            </button>
          </div>

          <ValidationErrors :errors="daysError ? [daysError] : []" />
        </div>

        <!-- Sale Period -->
        <div class="grid sm:grid-cols-2 gap-6">
          <CInput
            id="ticket-sale-from"
            v-model="formData.saleFrom"
            :label="t('admin.tickets.saleFrom')"
            type="datetime-local"
            :errors="r$.$errors.saleFrom"
            :helper-text="t('common.actions.optional')"
            class="col-span-full sm:col-span-1"
          />

          <CInput
            id="ticket-sale-until"
            v-model="formData.saleUntil"
            :label="t('admin.tickets.saleUntil')"
            type="datetime-local"
            :errors="r$.$errors.saleUntil"
            :helper-text="t('common.actions.optional')"
            class="col-span-full sm:col-span-1"
          />
        </div>

        <!-- Popular option -->
        <div class="flex items-center justify-between">
          <span class="flex grow flex-col">
            <label
              id="availability-label"
              class="text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t('admin.tickets.popularChoice') }}</label
            >
            <span
              id="availability-description"
              class="text-sm text-gray-500 dark:text-gray-400"
              >{{ t('admin.tickets.popularChoiceDescription') }}</span
            >
          </span>
          <div
            class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-primary-600 transition-colors duration-200 ease-in-out has-checked:bg-primary-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-primary-500 dark:has-checked:bg-primary-500"
          >
            <span
              class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
            ></span>
            <input
              id="availability"
              v-model="formData.isPopular"
              type="checkbox"
              class="absolute inset-0 size-full appearance-none focus:outline-hidden"
              name="availability"
              aria-labelledby="availability-label"
              aria-describedby="availability-description"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end mt-6">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.actions.cancel') }}
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
import { dateAfter, minValue, required } from '@regle/rules'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { IconCheck } from '@tabler/icons-vue'
import { DateTime } from 'luxon'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CInputCurrency from '@/components/CInputCurrency.vue'
import ValidationErrors from '@/components/ValidationErrors.vue'
import ticketService from '@/features/tickets/service'
import type { TicketDay } from '@/features/tickets/ticket.model'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import logger from '@/lib/logger'
import { formatDayLabel } from '@/utils/date'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t, locale } = useI18n()

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const formData = ref<{
  name: string
  price: string
  saleFrom: string
  saleUntil: string
  isPopular: boolean
  dayIds: string[]
}>({
  name: '',
  price: '',
  saleFrom: '',
  saleUntil: '',
  isPopular: false,
  dayIds: [],
})

const isSubmitting = ref<boolean>(false)
const ticketDays = ref<TicketDay[]>([])
const loadingDays = ref<boolean>(false)
const daysError = ref<string>('')

const emit = defineEmits<{
  close: []
  created: []
}>()

const { r$ } = useRegle(formData, {
  name: { required },
  price: { required, minValue: minValue(0) },
  saleFrom: {
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
  },
  saleUntil: {
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
    // must be after sale from, to be implemented later
  },
})

const isDaySelected = (dayId: string): boolean =>
  formData.value.dayIds.includes(dayId)

const toggleDay = (dayId: string): void => {
  const index = formData.value.dayIds.indexOf(dayId)
  if (index === -1) {
    formData.value.dayIds.push(dayId)
  } else {
    formData.value.dayIds.splice(index, 1)
  }
  daysError.value = ''
}

const dayLabel = (day: string): string => formatDayLabel(day, locale.value)

const loadTicketDays = async (): Promise<void> => {
  if (!tenantStore.tenant?.id || !editionStore.edition?.id) return

  loadingDays.value = true
  try {
    ticketDays.value = await ticketService.getDays(
      tenantStore.tenant.id,
      editionStore.edition.id,
    )
  } catch (error) {
    logger.error('Error loading ticket days:', { error })
    toast.error(t('admin.tickets.loadDaysFailed'))
  } finally {
    loadingDays.value = false
  }
}

onMounted(loadTicketDays)

watch(
  () => props.open,
  (open) => {
    if (open) void loadTicketDays()
  },
)

const resetForm = (): void => {
  formData.value = {
    name: '',
    price: '',
    saleFrom: '',
    saleUntil: '',
    isPopular: false,
    dayIds: [],
  }
  daysError.value = ''
  r$.$reset()
}

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  // Validate form before submitting
  const { valid } = await r$.$validate()

  daysError.value =
    formData.value.dayIds.length === 0
      ? t('admin.tickets.selectAtLeastOneDay')
      : ''

  if (!valid || daysError.value) {
    logger.debug('Form has validation errors', r$.$errors)
    return
  }

  if (!tenantStore.tenant?.id || !editionStore.edition?.id) {
    toast.error(t('admin.tickets.missingTenantOrEdition'))
    return
  }

  isSubmitting.value = true

  try {
    await ticketService.create(tenantStore.tenant.id, editionStore.edition.id, {
      name: formData.value.name,
      price: parseFloat(formData.value.price) * 100, // save value in cents
      isPopular: formData.value.isPopular,
      dayIds: formData.value.dayIds,
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
