export const formatPrice = (
  price: number,
  currency: string,
  locale?: string,
): string => {
  const resolvedLocale: string | undefined =
    locale ??
    (typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : undefined)

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(price / 100)
}
