import { createI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import type { TranslationSchema } from './locales/en'

// Auto-import all locale files using Vite's glob import
// Files must be named with the locale code (e.g., en.ts, pt.ts, es.ts)
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*.ts',
  { eager: true },
)

// English is the base/fallback - import it directly for type safety
import en from './locales/en'

export type MessageSchema = TranslationSchema | Partial<TranslationSchema>

// Extract locale code from file path (e.g., './locales/pt.ts' -> 'pt')
function getLocaleCode(path: string): string {
  const match = path.match(/\.\/locales\/(.+)\.ts$/)
  return match && match[1] ? match[1] : ''
}

// Build messages object from all discovered locale files
const messages: Record<string, TranslationSchema | Partial<TranslationSchema>> =
  {}
const availableLocaleCodes: string[] = []

for (const [path, module] of Object.entries(localeModules)) {
  const code = getLocaleCode(path)
  if (code) {
    availableLocaleCodes.push(code)
    if (code === 'en') {
      // English is the base, use as-is
      messages[code] = en
    } else {
      // Use other locales as-is; vue-i18n will fall back to English at runtime for missing keys
      messages[code] = module.default as Partial<TranslationSchema>
    }
  }
}

// Export available locales for use in language switchers
export const AVAILABLE_LOCALE_CODES = availableLocaleCodes
export const DEFAULT_LOCALE = 'en'
export const FALLBACK_LOCALE = 'en'

// Locale display names - keep in sync with available translation files in ./locales
const LOCALE_NAMES: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  // Add new locales here when their ./locales/<code>.ts file is created
}

export interface LocaleInfo {
  code: string
  name: string
  nativeName: string
}

// Build AVAILABLE_LOCALES from discovered files
export const AVAILABLE_LOCALES: LocaleInfo[] = availableLocaleCodes.map(
  (code) => ({
    code,
    name: LOCALE_NAMES[code]?.name ?? code,
    nativeName: LOCALE_NAMES[code]?.nativeName ?? code,
  }),
)

// Check if a locale code is valid (has a translation file)
function isValidLocale(code: string): boolean {
  return availableLocaleCodes.includes(code)
}

const LOCALE_STORAGE_KEY = 'app-locale'
const storedLocale = useStorage(LOCALE_STORAGE_KEY, DEFAULT_LOCALE)

function getInitialLocale(): string {
  const saved = storedLocale.value
  if (saved && isValidLocale(saved)) {
    return saved
  }

  try {
    const browserLang = navigator.language.split('-')[0] ?? ''
    if (browserLang && isValidLocale(browserLang)) {
      return browserLang
    }
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE
}

export const i18n = createI18n<[MessageSchema], string>({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
  globalInjection: true,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

export default i18n
