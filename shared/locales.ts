/**
 * The languages this app has catalogs for.
 *
 * Written down here because both halves of the app need it and neither can
 * import the other's copy: `src/i18n/` discovers its catalogs with
 * `import.meta.glob`, which only Vite understands, and
 * `server/middleware/locale.ts` is bundled by Nitro. `shared/` is the one
 * directory both bundlers read.
 *
 * The server middleware uses this to decide what a cached response may be
 * keyed by, so an unknown code must never reach it — see step 5a of
 * `docs/ssr-migration.md`. `src/i18n/__tests__/locales.spec.ts` checks that
 * the catalogs on disk are exactly these.
 */
export const LOCALES = ['en', 'pt'] as const

export type Locale = (typeof LOCALES)[number]

/** English: the language a request falls back to, and the fallback per string. */
export const DEFAULT_LOCALE: Locale = 'en'

/** Whether we have a catalog for this code. */
export function isKnownLocale(code: string | null | undefined): code is Locale {
  return !!code && (LOCALES as readonly string[]).includes(code)
}
