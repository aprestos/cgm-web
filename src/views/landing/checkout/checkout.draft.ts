import type { CheckoutDraft } from '@/views/landing/checkout/checkout.model'
import logger from '@/lib/logger.ts'

const CHECKOUT_DRAFT_KEY = 'congremio:checkout:v1'

/**
 * Persists the current checkout draft to localStorage so attendees and progress
 * survive the full-page redirect to and from Stripe (e.g. when payment fails).
 */
export function saveCheckoutDraft(draft: CheckoutDraft): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft))
}

/**
 * Restores the latest checkout draft from localStorage when available.
 * Invalid payloads are discarded to avoid keeping corrupted state.
 */
export function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as CheckoutDraft
  } catch (error) {
    logger.warn('Unable to parse checkout draft cache, clearing cache', {
      error,
    })
    localStorage.removeItem(CHECKOUT_DRAFT_KEY)
    return null
  }
}

/** Clears the persisted checkout draft once the order is completed. */
export function clearCheckoutDraft(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(CHECKOUT_DRAFT_KEY)
}
