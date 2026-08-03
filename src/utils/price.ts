import { editionStore } from '@/features/events/edition.store'

export const formatPrice = (price: number, locale?: string): string => {
  const resolvedLocale: string | undefined =
    locale ??
    (typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : undefined)

  const currency = editionStore.value?.currency

  return currency
    ? new Intl.NumberFormat(resolvedLocale, {
        style: 'currency',
        currency,
      }).format(price / 100)
    : '-'
}
