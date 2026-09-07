import { getActivePinia } from 'pinia'
import { useEditionStore } from '@/features/events/edition.store'

export const formatPrice = (price: number, locale?: string): string => {
  const resolvedLocale: string | undefined =
    locale ??
    (typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : undefined)

  // Reachable from tests and other callers with no app installed, where the
  // absence of an edition is the same answer as a tenant without a currency.
  const currency = getActivePinia()
    ? useEditionStore().edition?.currency
    : undefined

  return currency
    ? new Intl.NumberFormat(resolvedLocale, {
        style: 'currency',
        currency,
      }).format(price / 100)
    : '-'
}
