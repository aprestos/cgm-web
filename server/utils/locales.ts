/**
 * The languages a cached response may be keyed by, and the header that carries
 * the choice.
 *
 * Hardcoded because `server/` is bundled by Nitro and cannot import
 * `src/i18n`, which discovers its catalogs with `import.meta.glob` — a Vite
 * feature. `src/i18n/__tests__/locales.spec.ts` asserts this list still matches
 * the catalogs, so it cannot drift silently.
 */
export const CACHEABLE_LOCALES = ['en', 'pt']

/**
 * Where the middleware puts the visitor's chosen language for the rest of the
 * request to read.
 *
 * A header rather than the cookie it came from, because a cached route varies
 * on header *names*: varying on `cookie` would put every session token in the
 * cache key and grow it without bound. This one has as many values as we have
 * languages.
 */
export const LOCALE_HEADER = 'x-app-locale'
