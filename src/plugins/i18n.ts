import { createAppI18n, DEFAULT_LOCALE, isValidLocale } from '@/i18n'
import {
  LOCALE_COOKIE,
  migrateLegacyLocale,
  readBrowserLocale,
} from '@/i18n/localePreference'

/**
 * Installs vue-i18n, one instance per app.
 *
 * `src/main.ts` used to do this with the instance the i18n module created at
 * import time. On a server that module is evaluated once and an app is created
 * per request, so a shared instance would make one visitor's language every
 * concurrent visitor's. Step 5e of `docs/ssr-migration.md`.
 *
 * The language is resolved here, before the app exists, and kept in
 * `useState` — so the server's answer travels to the browser in the payload
 * and hydration starts from the same language the server rendered, rather than
 * working it out again and possibly disagreeing.
 */
export default defineNuxtPlugin({
  name: 'i18n',

  setup(nuxtApp) {
    const locale = useState<string>('locale', resolveLocale)
    nuxtApp.vueApp.use(createAppI18n(locale.value))
  },
})

/**
 * The language this request should be rendered in.
 *
 * The cookie first, because it is the only source both sides of a render can
 * read and the only one that is an actual choice. Then what the visitor's
 * browser asks for — `Accept-Language` on a server, `navigator` in a browser,
 * which are the same preference reported through two different channels.
 */
function resolveLocale(): string {
  const chosen = useCookie(LOCALE_COOKIE).value
  if (isValidLocale(chosen)) return chosen

  if (import.meta.client) {
    const legacy = migrateLegacyLocale()
    if (isValidLocale(legacy)) return legacy
  }

  const asked = import.meta.server ? requestedLanguage() : readBrowserLocale()
  if (isValidLocale(asked)) return asked

  return DEFAULT_LOCALE
}

/**
 * The first language of the request's `Accept-Language`, as a bare code.
 *
 * Deliberately not a full negotiation: the header is a ranked list and we have
 * two catalogs, so the only question worth asking is whether the language the
 * visitor most wants is one of them. Anything else falls back to English,
 * which is what `fallbackLocale` would have done per string anyway.
 */
function requestedLanguage(): string | null {
  const header = useRequestHeaders(['accept-language'])['accept-language']
  if (!header) return null

  const first = header.split(',')[0]?.split(';')[0]?.trim()
  return first ? (first.split('-')[0] ?? null) : null
}
