<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  IconArrowLeft,
  IconCheck,
  IconCreditCard,
  IconTicket,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { User } from '@/features/auth/user.model'
import { authService } from '@/features/auth/service'
import { useCart, type CartItem } from '@/stores/cart.store'
import { formatPrice } from '@/utils/price'
import ProgressView from '@/views/landing/checkout/ProgressView.vue'
import { formatWeekday } from '@/utils/date.ts'
import { RouteNames } from '@/router/routeNames.ts'

type CheckoutStepId = 'account' | 'tickets' | 'payment' | 'completed'

interface CheckoutStep {
  id: CheckoutStepId
  name: string
}

interface CheckoutProgressStep {
  id: CheckoutStepId
  name: string
  status: 'completed' | 'current' | 'upcoming'
}

interface TicketAttendee {
  key: string
  ticketId: number
  ticketName: string
  price: number
  holderName: string
  holderEmail: string
}

interface AccountForm {
  name: string
  email: string
  acceptedTerms: boolean
}

interface PaymentForm {
  cardName: string
  cardNumber: string
  expiry: string
  cvv: string
}

interface InvoiceAddressForm {
  companyName: string
  vatNumber: string
  addressLine1: string
  city: string
  postalCode: string
  country: string
}

interface CompletedOrder {
  reference: string
  createdAt: string
  items: CartItem[]
  attendees: TicketAttendee[]
  subtotal: number
  taxes: number
  total: number
}

const { t, locale } = useI18n()

const { cartItems, totalItems, totalPrice, clearCart } = useCart()

const isLoadingUser = ref<boolean>(true)
const isProcessingPayment = ref<boolean>(false)
const currentStep = ref<CheckoutStepId>('account')
const user = ref<User | null>(null)

const accountForm = ref<AccountForm>({
  name: '',
  email: '',
  acceptedTerms: false,
})
const paymentForm = ref<PaymentForm>({
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
})
const invoiceAddressForm = ref<InvoiceAddressForm>({
  companyName: '',
  vatNumber: '',
  addressLine1: '',
  city: '',
  postalCode: '',
  country: '',
})
const ticketAttendees = ref<TicketAttendee[]>([])
const completedOrder = ref<CompletedOrder | null>(null)

const accountErrors = ref<Record<string, string>>({})
const attendeeErrors = ref<Record<string, string>>({})
const paymentErrors = ref<Record<string, string>>({})

const isAuthenticated = computed((): boolean => user.value !== null)
const isCartEmpty = computed((): boolean => totalItems.value === 0)

const availableSteps = computed((): CheckoutStep[] => {
  const allSteps: CheckoutStep[] = [
    { id: 'account', name: t('checkout.section.account') },
    { id: 'tickets', name: t('checkout.section.tickets') },
    { id: 'payment', name: t('checkout.section.payment') },
    { id: 'completed', name: t('checkout.section.completed') },
  ]

  return isAuthenticated.value
    ? allSteps.filter((step) => step.id !== 'account')
    : allSteps
})

const progressSteps = computed((): CheckoutProgressStep[] => {
  const currentIndex = availableSteps.value.findIndex(
    (step) => step.id === currentStep.value,
  )

  return availableSteps.value.map((step, index) => ({
    id: step.id,
    name: step.name,
    status:
      index < currentIndex
        ? 'completed'
        : index === currentIndex
          ? 'current'
          : 'upcoming',
  }))
})

const stepIndex = computed((): number =>
  availableSteps.value.findIndex((step) => step.id === currentStep.value),
)

const subtotal = computed((): number => totalPrice.value)
const taxes = computed((): number => Number((subtotal.value * 0.23).toFixed(2)))
const total = computed((): number => subtotal.value + taxes.value)

const orderItems = computed(
  (): CartItem[] => completedOrder.value?.items ?? cartItems.value,
)
const orderSubtotal = computed(
  (): number => completedOrder.value?.subtotal ?? subtotal.value,
)
const orderTaxes = computed(
  (): number => completedOrder.value?.taxes ?? taxes.value,
)
const orderTotal = computed(
  (): number => completedOrder.value?.total ?? total.value,
)

watch(
  () => availableSteps.value,
  (steps: CheckoutStep[]): void => {
    const firstStep = steps[0]
    if (!firstStep) {
      return
    }

    if (!steps.some((step) => step.id === currentStep.value)) {
      currentStep.value = firstStep.id
    }
  },
  { immediate: true },
)

watch(
  () => cartItems.value,
  (items: CartItem[]): void => {
    syncTicketAttendees(items)
  },
  { immediate: true, deep: true },
)

onMounted(async (): Promise<void> => {
  try {
    user.value = await authService.getUser()
    if (user.value) {
      accountForm.value.name = user.value.name
      accountForm.value.email = user.value.email
      currentStep.value = 'tickets'
    }
  } finally {
    isLoadingUser.value = false
  }
})

function syncTicketAttendees(items: CartItem[]): void {
  const previous = new Map<string, TicketAttendee>()
  for (const attendee of ticketAttendees.value) {
    previous.set(attendee.key, attendee)
  }

  const nextAttendees: TicketAttendee[] = []

  for (const item of items) {
    for (let index = 0; index < item.quantity; index += 1) {
      const key = `${item.ticket.id}-${index}`
      const existing = previous.get(key)
      nextAttendees.push({
        key,
        ticketId: item.ticket.id,
        ticketName: formatWeekday(
          item.ticket.validFrom,
          item.ticket.validUntil,
          locale.value,
        ),
        price: item.ticket.price,
        holderName: existing?.holderName ?? accountForm.value.name,
        holderEmail: existing?.holderEmail ?? accountForm.value.email,
      })
    }
  }

  ticketAttendees.value = nextAttendees
}

function updateAttendeeName(key: string, value: string): void {
  const attendee = ticketAttendees.value.find((item) => item.key === key)
  if (!attendee) {
    return
  }
  attendee.holderName = value
}

function updateAttendeeEmail(key: string, value: string): void {
  const attendee = ticketAttendees.value.find((item) => item.key === key)
  if (!attendee) {
    return
  }
  attendee.holderEmail = value
}

function goToPreviousStep(): void {
  if (stepIndex.value <= 0) {
    return
  }
  const previousStep = availableSteps.value[stepIndex.value - 1]
  if (!previousStep) {
    return
  }
  currentStep.value = previousStep.id
}

function goToNextStep(): void {
  if (stepIndex.value >= availableSteps.value.length - 1) {
    return
  }
  const nextStep = availableSteps.value[stepIndex.value + 1]
  if (!nextStep) {
    return
  }
  currentStep.value = nextStep.id
}

function validateAccountStep(): boolean {
  const errors: Record<string, string> = {}
  if (!accountForm.value.name.trim()) {
    errors.name = t('checkout.validation.nameRequired')
  }
  if (!accountForm.value.email.includes('@')) {
    errors.email = t('checkout.validation.emailRequired')
  }
  if (!accountForm.value.acceptedTerms) {
    errors.terms = t('checkout.validation.termsRequired')
  }
  accountErrors.value = errors
  return Object.keys(errors).length === 0
}

function validateTicketsStep(): boolean {
  const errors: Record<string, string> = {}

  for (const attendee of ticketAttendees.value) {
    if (!attendee.holderName.trim()) {
      errors[`${attendee.key}-name`] = t('checkout.validation.nameRequired')
    }
    if (!attendee.holderEmail.includes('@')) {
      errors[`${attendee.key}-email`] = t('checkout.validation.emailRequired')
    }
  }

  attendeeErrors.value = errors
  return Object.keys(errors).length === 0
}

function validatePaymentStep(): boolean {
  const errors: Record<string, string> = {}
  if (!paymentForm.value.cardName.trim()) {
    errors.cardName = t('checkout.validation.cardNameRequired')
  }
  if (paymentForm.value.cardNumber.replaceAll(' ', '').length < 14) {
    errors.cardNumber = t('checkout.validation.cardNumberRequired')
  }
  if (!paymentForm.value.expiry.trim()) {
    errors.expiry = t('checkout.validation.expiryRequired')
  }
  if (paymentForm.value.cvv.trim().length < 3) {
    errors.cvv = t('checkout.validation.cvvRequired')
  }
  if (!invoiceAddressForm.value.addressLine1.trim()) {
    errors.addressLine1 = t('checkout.validation.addressRequired')
  }
  if (!invoiceAddressForm.value.city.trim()) {
    errors.city = t('checkout.validation.cityRequired')
  }
  if (!invoiceAddressForm.value.postalCode.trim()) {
    errors.postalCode = t('checkout.validation.postalCodeRequired')
  }
  if (!invoiceAddressForm.value.country.trim()) {
    errors.country = t('checkout.validation.countryRequired')
  }
  paymentErrors.value = errors
  return Object.keys(errors).length === 0
}

function handleAccountContinue(): void {
  if (!validateAccountStep()) {
    return
  }
  syncTicketAttendees(cartItems.value)
  goToNextStep()
}

function handleTicketsContinue(): void {
  if (!validateTicketsStep()) {
    return
  }
  goToNextStep()
}

async function handlePaymentSubmit(): Promise<void> {
  if (!validatePaymentStep()) {
    return
  }

  isProcessingPayment.value = true

  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 1200)
  })

  completedOrder.value = {
    reference: `CG-${Date.now().toString().slice(-8)}`,
    createdAt: new Date().toISOString(),
    items: [...cartItems.value],
    attendees: ticketAttendees.value.map((attendee) => ({ ...attendee })),
    subtotal: subtotal.value,
    taxes: taxes.value,
    total: total.value,
  }

  clearCart()
  currentStep.value = 'completed'
  isProcessingPayment.value = false
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-x-hidden bg-gray-50 pt-24 text-gray-900 dark:bg-gray-950 dark:text-white"
  >
    <div
      class="absolute inset-x-0 top-0 z-0 h-72 bg-linear-to-b from-indigo-100/70 to-transparent dark:from-indigo-900/30"
    />

    <div
      class="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
    >
      <header>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
          {{ t('checkout.title') }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {{ t('checkout.subtitle') }}
        </p>
      </header>

      <div class="mt-6">
        <ProgressView :steps="progressSteps" />
      </div>

      <div
        v-if="isCartEmpty && currentStep !== 'completed'"
        class="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-white/15 dark:bg-gray-900"
      >
        <p class="text-lg font-semibold">{{ t('checkout.emptyCart.title') }}</p>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ t('checkout.emptyCart.description') }}
        </p>
        <RouterLink
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          :to="{ name: RouteNames.landing.home, hash: '#tickets' }"
        >
          <IconArrowLeft class="size-4" />
          {{ t('checkout.emptyCart.action') }}
        </RouterLink>
      </div>

      <div v-else class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section
          class="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-8"
        >
          <div v-if="currentStep === 'account'" class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold">
                {{ t('checkout.section.account') }}
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ t('checkout.account.description') }}
              </p>
            </div>

            <p v-if="isLoadingUser" class="text-sm text-gray-500">
              {{ t('checkout.account.loading') }}
            </p>

            <template v-else>
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-200"
                  for="checkout-account-name"
                >
                  {{ t('checkout.account.name') }}
                </label>
                <input
                  id="checkout-account-name"
                  v-model="accountForm.name"
                  type="text"
                  class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-950"
                />
                <p v-if="accountErrors.name" class="mt-1 text-xs text-red-500">
                  {{ accountErrors.name }}
                </p>
              </div>

              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-200"
                  for="checkout-account-email"
                >
                  {{ t('checkout.account.email') }}
                </label>
                <input
                  id="checkout-account-email"
                  v-model="accountForm.email"
                  type="email"
                  autocomplete="email"
                  class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-950"
                />
                <p v-if="accountErrors.email" class="mt-1 text-xs text-red-500">
                  {{ accountErrors.email }}
                </p>
              </div>

              <label
                class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-950"
              >
                <input
                  v-model="accountForm.acceptedTerms"
                  type="checkbox"
                  class="mt-0.5 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-600 dark:text-gray-300">{{
                  t('checkout.account.terms')
                }}</span>
              </label>
              <p v-if="accountErrors.terms" class="-mt-4 text-xs text-red-500">
                {{ accountErrors.terms }}
              </p>

              <div class="flex justify-end">
                <button
                  type="button"
                  class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  @click="handleAccountContinue"
                >
                  {{ t('checkout.actions.continue') }}
                </button>
              </div>
            </template>
          </div>

          <div v-if="currentStep === 'tickets'" class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold">
                {{ t('checkout.section.tickets') }}
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ t('checkout.tickets.description') }}
              </p>
            </div>

            <div class="space-y-4">
              <article
                v-for="(attendee, index) in ticketAttendees"
                :key="attendee.key"
                class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-950"
              >
                <p
                  class="text-sm font-semibold text-indigo-600 dark:text-indigo-300"
                >
                  <IconTicket class="mr-1 inline size-4" />
                  {{ attendee.ticketName }} ·
                  {{
                    t('checkout.tickets.ticketNumber', { number: index + 1 })
                  }}
                </p>

                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      {{ t('checkout.account.name') }}
                    </label>
                    <input
                      :value="attendee.holderName"
                      type="text"
                      class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                      @input="
                        updateAttendeeName(
                          attendee.key,
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                    <p
                      v-if="attendeeErrors[`${attendee.key}-name`]"
                      class="mt-1 text-xs text-red-500"
                    >
                      {{ attendeeErrors[`${attendee.key}-name`] }}
                    </p>
                  </div>

                  <div>
                    <label
                      class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      {{ t('checkout.account.email') }}
                    </label>
                    <input
                      :value="attendee.holderEmail"
                      type="email"
                      class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                      @input="
                        updateAttendeeEmail(
                          attendee.key,
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                    <p
                      v-if="attendeeErrors[`${attendee.key}-email`]"
                      class="mt-1 text-xs text-red-500"
                    >
                      {{ attendeeErrors[`${attendee.key}-email`] }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
                @click="goToPreviousStep"
              >
                {{ t('checkout.actions.back') }}
              </button>
              <button
                type="button"
                class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                @click="handleTicketsContinue"
              >
                {{ t('checkout.actions.continue') }}
              </button>
            </div>
          </div>

          <div v-if="currentStep === 'payment'" class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold">
                {{ t('checkout.section.payment') }}
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ t('checkout.payment.description') }}
              </p>
            </div>

            <div
              class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-950"
            >
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white">
                <IconCreditCard class="mr-1 inline size-4" />
                {{ t('checkout.payment.cardDetails') }}
              </h3>

              <div class="mt-3 space-y-3">
                <div>
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.cardName') }}</label
                  >
                  <input
                    v-model="paymentForm.cardName"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.cardName"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.cardName }}
                  </p>
                </div>

                <div>
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.cardNumber') }}</label
                  >
                  <input
                    v-model="paymentForm.cardNumber"
                    type="text"
                    inputmode="numeric"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.cardNumber"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.cardNumber }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="text-xs font-medium text-gray-600 dark:text-gray-300"
                      >{{ t('checkout.payment.expiry') }}</label
                    >
                    <input
                      v-model="paymentForm.expiry"
                      type="text"
                      placeholder="MM/YY"
                      class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                    />
                    <p
                      v-if="paymentErrors.expiry"
                      class="mt-1 text-xs text-red-500"
                    >
                      {{ paymentErrors.expiry }}
                    </p>
                  </div>

                  <div>
                    <label
                      class="text-xs font-medium text-gray-600 dark:text-gray-300"
                      >{{ t('checkout.payment.cvv') }}</label
                    >
                    <input
                      v-model="paymentForm.cvv"
                      type="text"
                      inputmode="numeric"
                      class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                    />
                    <p
                      v-if="paymentErrors.cvv"
                      class="mt-1 text-xs text-red-500"
                    >
                      {{ paymentErrors.cvv }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-950"
            >
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white">
                {{ t('checkout.payment.invoiceAddress') }}
              </h3>

              <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.companyName') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.companyName"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.vatNumber') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.vatNumber"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.address') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.addressLine1"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.addressLine1"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.addressLine1 }}
                  </p>
                </div>

                <div>
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.city') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.city"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.city"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.city }}
                  </p>
                </div>

                <div>
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.postalCode') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.postalCode"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.postalCode"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.postalCode }}
                  </p>
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="text-xs font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('checkout.payment.country') }}</label
                  >
                  <input
                    v-model="invoiceAddressForm.country"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
                  />
                  <p
                    v-if="paymentErrors.country"
                    class="mt-1 text-xs text-red-500"
                  >
                    {{ paymentErrors.country }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
                @click="goToPreviousStep"
              >
                {{ t('checkout.actions.back') }}
              </button>
              <button
                type="button"
                class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="isProcessingPayment"
                @click="handlePaymentSubmit"
              >
                {{
                  isProcessingPayment
                    ? t('checkout.actions.processing')
                    : t('checkout.actions.payNow')
                }}
              </button>
            </div>
          </div>

          <div v-if="currentStep === 'completed'" class="space-y-5">
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
                  completedOrder?.reference
                }}</span>
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {{ t('checkout.completed.total') }}:
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  formatPrice(orderTotal)
                }}</span>
              </p>
            </div>

            <div>
              <h3
                class="text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                {{ t('checkout.completed.attendees') }}
              </h3>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="attendee in completedOrder?.attendees"
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
        </section>

        <aside
          class="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-6 lg:sticky lg:top-24"
        >
          <h2 class="text-lg font-semibold">
            {{ t('checkout.section.summary') }}
          </h2>

          <ul class="mt-4 space-y-3">
            <li
              v-for="item in orderItems"
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
              class="flex items-center justify-between text-gray-600 dark:text-gray-300"
            >
              <dt>{{ t('checkout.summary.subtotal') }}</dt>
              <dd>{{ formatPrice(orderSubtotal) }}</dd>
            </div>
            <div
              class="flex items-center justify-between text-gray-600 dark:text-gray-300"
            >
              <dt>{{ t('checkout.summary.taxes') }}</dt>
              <dd>{{ formatPrice(orderTaxes) }}</dd>
            </div>
            <div
              class="flex items-center justify-between pt-2 text-base font-semibold text-gray-900 dark:text-white"
            >
              <dt>{{ t('checkout.summary.total') }}</dt>
              <dd>{{ formatPrice(orderTotal) }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  </div>
</template>
