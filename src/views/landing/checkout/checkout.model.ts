import type { CartItem } from '@/stores/cart.store'

export type CheckoutStepId = 'account' | 'tickets' | 'payment' | 'completed'

export interface CheckoutStep {
  id: CheckoutStepId
  name: string
}

export interface CheckoutProgressStep {
  id: CheckoutStepId
  name: string
  status: 'completed' | 'current' | 'upcoming'
}

export interface TicketAttendee {
  key: string
  ticketId: number
  ticketName: string
  price?: number
  holderName: string
  holderEmail: string
}

export interface AccountForm {
  name: string
  email: string
  acceptedTerms: boolean
}

export interface CompletedOrder {
  id: string
  items: CartItem[]
  attendees: TicketAttendee[]
  total: number
}

/**
 * Snapshot of in-progress checkout state persisted to localStorage so it
 * survives the full-page redirect to and from Stripe. Card details are
 * intentionally excluded (sensitive, and collected by Stripe directly).
 */
export interface CheckoutDraft {
  currentStep: CheckoutStepId
  accountForm: AccountForm
  ticketAttendees: TicketAttendee[]
  checkoutSessionId: string | null
}
