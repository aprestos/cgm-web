import { createI18n } from 'vue-i18n'
import type { TranslationSchema } from './locales/en'

// Auto-import all locale directories using Vite's glob import
// Each locale is a directory named with the locale code (e.g., en/, pt/, es/)
// whose index.ts assembles the per-namespace message files
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*/index.ts',
  { eager: true },
)

// English is the base/fallback - import it directly for type safety
import en from './locales/en'

export type MessageSchema = TranslationSchema | Partial<TranslationSchema>

// Extract locale code from file path (e.g., './locales/pt/index.ts' -> 'pt')
function getLocaleCode(path: string): string {
  const match = path.match(/\.\/locales\/(.+)\/index\.ts$/)
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
      messages[code] = module.default
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
  // Add new locales here when their ./locales/<code>/ directory is created
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

/** Whether we actually have a catalog for this language. */
export function isValidLocale(code: string | null | undefined): code is string {
  return !!code && availableLocaleCodes.includes(code)
}

/**
 * The instance itself, with its type left to be inferred.
 *
 * `createI18n` is overloaded and its generics do not reproduce by hand what it
 * actually returns — every spelling of the return type either picks the wrong
 * overload or produces something the real instance is not assignable to. So it
 * is inferred here once, and `AppI18n` below is that inferred type.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildI18n(locale: string) {
  return createI18n<[MessageSchema], string>({
    legacy: false, // Use Composition API mode
    locale,
    fallbackLocale: FALLBACK_LOCALE,
    messages,
    globalInjection: true,
    missingWarn: import.meta.env.DEV,
    fallbackWarn: import.meta.env.DEV,
  })
}

/** One app's i18n instance, as `createAppI18n` builds it. */
export type AppI18n = ReturnType<typeof buildI18n>

/**
 * Builds an i18n instance for one app.
 *
 * A factory rather than a `createI18n()` at module scope, because a server
 * evaluates this module once and creates an app per request. A shared instance
 * makes one visitor's language every concurrent visitor's language — the same
 * class of bug PR #81 fixed for the stores.
 *
 * It had not bitten yet only because nothing ever *set* the locale outside the
 * browser: every server render came out in the default language and the
 * visitor's own choice was applied on hydration, which is a mismatch on every
 * translated string. Resolving the language per request is what step 5d needs
 * to put it in `<html lang>`, and it is why this had to come first.
 */
export function createAppI18n(locale: string): AppI18n {
  return buildI18n(isValidLocale(locale) ? locale : DEFAULT_LOCALE)
}
