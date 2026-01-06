import { useI18n } from 'vue-i18n'
import { editionStore } from '@/stores/edition.ts'

export const formatPrice = (price: number): string => {
  const locale = useI18n().locale.value
  return editionStore.value?.currency
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: editionStore.value?.currency,
      }).format(price)
    : '-'
}
