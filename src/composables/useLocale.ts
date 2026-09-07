import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Composer } from 'vue-i18n'
import type { LocaleInfo } from '@/i18n'
import { AVAILABLE_LOCALES, AVAILABLE_LOCALE_CODES } from '@/i18n'
import { storeLocale } from '@/i18n/localePreference'

interface UseLocaleReturn {
  locale: Composer['locale']
  availableLocales: LocaleInfo[]
  currentLocale: Readonly<ComputedRef<LocaleInfo | undefined>>
  setLocale: (code: string) => void
  t: Composer['t']
  d: Composer['d']
  n: Composer['n']
}

/**
 * Check if a locale code is valid (has a translation file)
 */
function isValidLocale(code: string): boolean {
  return AVAILABLE_LOCALE_CODES.includes(code)
}

/**
 * Composable for managing application locale
 */
export function useLocale(): UseLocaleReturn {
  const { locale, t, d, n } = useI18n()

  const currentLocale = computed(() => {
    return AVAILABLE_LOCALES.find((l) => l.code === locale.value)
  })

  const setLocale = (code: string): void => {
    if (!isValidLocale(code)) {
      console.warn(`Invalid locale code: ${code}`)
      return
    }
    locale.value = code
    storeLocale(code)
  }

  return {
    locale,
    availableLocales: AVAILABLE_LOCALES,
    currentLocale,
    setLocale,
    t,
    d,
    n,
  }
}
