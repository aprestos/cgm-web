import type { CheckoutDraft } from '@/views/landing/checkout/checkout.model'
import { useStorage } from '@vueuse/core'

const CHECKOUT_DRAFT_KEY = 'congremio:checkout:v1'
const storedDraft = useStorage<CheckoutDraft | null>(CHECKOUT_DRAFT_KEY, null)

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  storedDraft.value = draft
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  return storedDraft.value
}

export function clearCheckoutDraft(): void {
  storedDraft.value = null
}
