import { CACHEABLE_LOCALES, LOCALE_HEADER } from '../utils/locales'

/**
 * Decides, once per request, which language this response is in, and puts the
 * answer in a header for the rest of the request to read.
 *
 * This exists for the cache. A cached route can only vary on header *names*,
 * and neither of the two things that decide the language is safe to key on:
 * `cookie` carries the visitor's session, so every visitor would get their own
 * copy of the same anonymous page, and `accept-language` is a free-form ranked
 * list with a different spelling in every browser. Resolving both down to one
 * of the two languages we actually have makes the cache key bounded —
 * (path, host, language) — and it is the same answer either way.
 *
 * The order is the one `plugins/i18n.ts` uses in the browser: the language the
 * visitor chose, then the one their browser asks for, then English.
 *
 * Step 5a of `docs/ssr-migration.md`.
 */
export default defineEventHandler((event) => {
  event.node.req.headers[LOCALE_HEADER] =
    // The cookie's name is duplicated from `src/i18n/localePreference.ts` for
    // the same reason the language list is: Nitro does not bundle `src/`.
    known(getCookie(event, 'app-locale')) ??
    known(preferredLanguage(getRequestHeader(event, 'accept-language'))) ??
    'en'
})

/** The code, if we have a catalog for it — so a crafted cookie or header
 *  cannot invent cache keys. */
function known(code: string | undefined | null): string | undefined {
  return code && CACHEABLE_LOCALES.includes(code) ? code : undefined
}

/**
 * The first language of an `Accept-Language` header, as a bare code.
 *
 * Deliberately not a full negotiation: the header is a ranked list and we have
 * two catalogs, so the only question worth asking is whether the language the
 * visitor most wants is one of them. Anything else falls through to English,
 * which is what `fallbackLocale` would have done per string anyway.
 */
function preferredLanguage(header: string | undefined): string | undefined {
  const first = header?.split(',')[0]?.split(';')[0]?.trim()
  return first ? first.split('-')[0] : undefined
}
