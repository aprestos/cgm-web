<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { User } from '@/features/auth/user.model'
import { authService } from '@/features/auth/service'
import { type CartItem, useCart } from '@/stores/cart.store'
import ProgressView from '@/views/landing/checkout/ProgressView.vue'
import AccountStep from '@/views/landing/checkout/AccountStep.vue'
import TicketsStep from '@/views/landing/checkout/TicketsStep.vue'
import PaymentStep from '@/views/landing/checkout/PaymentStep.vue'
import CompletedStep from '@/views/landing/checkout/CompletedStep.vue'
import OrderSummary from '@/views/landing/checkout/OrderSummary.vue'
import type {
  AccountForm,
  CheckoutProgressStep,
  CheckoutStep,
  CheckoutStepId,
  CompletedOrder,
  TicketAttendee,
} from '@/views/landing/checkout/checkout.model'
import { formatWeekday } from '@/utils/date.ts'
import { RouteNames } from '@/router/routeNames.ts'
import { orderService } from '@/features/orders/service.ts'
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from '@/views/landing/checkout/checkout.draft.ts'
import paymentsService from '@/features/payments/service.ts'
import { toast } from 'vue-sonner'
import logger from '@/lib/logger.ts'
import type { Order } from '@/features/orders/order.model.ts'

const { t, locale } = useI18n()

const route = useRoute()

const { cartItems, totalItems, totalPrice, clearCart } = useCart()

const isLoadingUser = ref<boolean>(true)
const isProcessingPayment = ref<boolean>(false)
const isConfirmingPayment = ref<boolean>(false)
const currentStep = ref<CheckoutStepId>('account')
const user = ref<User | null>(null)

const accountForm = ref<AccountForm>({
  name: '',
  email: '',
  acceptedTerms: false,
})

const ticketAttendees = ref<TicketAttendee[]>([])
const completedOrder = ref<CompletedOrder | null>(null)
const checkoutSessionId = ref<string | null>(null)
const paymentError = ref<string | null>(null)

const accountErrors = ref<Record<string, string>>({})

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
const taxes = computed((): number => 0)
const total = computed((): number => subtotal.value + taxes.value)

const orderItems = computed(
  (): CartItem[] => completedOrder.value?.items ?? cartItems.value,
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

// Snapshot in-progress checkout state so attendees and progress survive the
// full-page redirect to and from Stripe. Card details are never persisted.
watch(
  [currentStep, accountForm, ticketAttendees],
  (): void => {
    persistDraft()
  },
  { deep: true },
)

onMounted(async (): Promise<void> => {
  try {
    user.value = await authService.getUser()
    if (user.value) {
      accountForm.value.name = user.value.name
      accountForm.value.email = user.value.email
      currentStep.value = 'tickets'
    }

    restoreDraft()
    handleStripeReturn()
  } finally {
    isLoadingUser.value = false
  }
})

/**
 * Persists the current checkout snapshot to localStorage. Skips the completed
 * step so a finished order is never restored on a later visit.
 */
function persistDraft(): void {
  if (currentStep.value === 'completed') {
    return
  }

  saveCheckoutDraft({
    currentStep: currentStep.value,
    accountForm: accountForm.value,
    ticketAttendees: ticketAttendees.value,
    checkoutSessionId: checkoutSessionId.value,
  })
}

/**
 * Restores a previously persisted checkout snapshot (e.g. after returning from
 * Stripe). An authenticated identity wins over the drafted account details.
 */
function restoreDraft(): void {
  const draft = loadCheckoutDraft()
  if (!draft) {
    return
  }

  if (!user.value) {
    accountForm.value = draft.accountForm
  }

  // Restore drafted holders, then reconcile against the live cart so quantities
  // and line items stay authoritative while holder values are preserved.
  ticketAttendees.value = draft.ticketAttendees
  syncTicketAttendees(cartItems.value)

  currentStep.value = draft.currentStep
}

/**
 * Reacts to the Stripe redirect outcome carried back on the URL. Success
 * polls the server until the order is marked as paid; a cancellation/error
 * returns to the payment step with attendees intact and a banner. The query
 * param is then cleared so a refresh does not re-trigger this branch.
 */
function handleStripeReturn(): void {
  const status = route.query.payment
  const sessionId: string = route.query.session_id as string
  if (typeof status !== 'string') {
    return
  }

  if (status === 'success' && sessionId) {
    isConfirmingPayment.value = true
    currentStep.value = 'payment'

    orderService
      .pollUntilPaid(sessionId)
      .then((order): void => {
        finalizeOrder(order)
      })
      .catch((error: unknown): void => {
        logger.error('Payment confirmation timed out', {
          sessionId,
          checkoutSessionId: checkoutSessionId.value,
          error,
        })
        paymentError.value = t('checkout.payment.confirmationTimeout')
        isConfirmingPayment.value = false
      })
  } else {
    currentStep.value = 'payment'
    paymentError.value =
      status === 'cancelled'
        ? t('checkout.payment.cancelled')
        : t('checkout.payment.failed')
  }
}

/**
 * Builds the completed-order snapshot from the current cart and attendees,
 * then clears the cart and persisted draft and advances to the completed step.
 */
function finalizeOrder(order: Order): void {
  completedOrder.value = {
    id: order.id,
    items: orderItems.value,
    attendees: ticketAttendees.value,
    total: order.total,
  }

  isConfirmingPayment.value = false
  clearCart()
  clearCheckoutDraft()
  currentStep.value = 'completed'
}

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

function handleAccountContinue(): void {
  if (!validateAccountStep()) {
    return
  }
  syncTicketAttendees(cartItems.value)
  goToNextStep()
}

function handleTicketsContinue(): void {
  goToNextStep()
}

async function handlePaymentSubmit(): Promise<void> {
  paymentError.value = null
  isProcessingPayment.value = true

  try {
    const { url, sessionId } =
      await paymentsService.createStripeCheckoutSession(
        cartItems.value.map((cartItem) => ({
          ticketId: cartItem.ticket.id,
          quantity: cartItem.quantity,
          name: formatWeekday(
            cartItem.ticket.validFrom,
            cartItem.ticket.validUntil,
            locale.value,
          ),
        })),
        ticketAttendees.value.map((attendee) => ({
          ticketId: attendee.ticketId,
          recipientName: attendee.holderName,
          recipientEmail: attendee.holderEmail,
        })),
      )

    checkoutSessionId.value = sessionId

    if (url) window.location.assign(url)
  } catch (error) {
    logger.error('Stripe checkout error', { error })
    isProcessingPayment.value = false
    paymentError.value = t('checkout.payment.failed')
    toast.error(paymentError.value)
  }
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
          <AccountStep
            v-if="currentStep === 'account'"
            v-model="accountForm"
            :errors="accountErrors"
            :is-loading="isLoadingUser"
            @continue="handleAccountContinue"
          />

          <TicketsStep
            v-else-if="currentStep === 'tickets'"
            v-model:attendees="ticketAttendees"
            @back="goToPreviousStep"
            @continue="handleTicketsContinue"
          />

          <PaymentStep
            v-else-if="currentStep === 'payment'"
            :is-processing="isProcessingPayment"
            :is-confirming="isConfirmingPayment"
            :payment-error="paymentError"
            @back="goToPreviousStep"
            @submit="handlePaymentSubmit"
          />

          <CompletedStep
            v-else-if="currentStep === 'completed'"
            :order-id="completedOrder?.id"
            :attendees="completedOrder?.attendees"
            :total="orderTotal"
          />
        </section>

        <OrderSummary :items="orderItems" :total="orderTotal" />
      </div>
    </div>
  </div>
</template>
