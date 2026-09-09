import { createAppI18n, DEFAULT_LOCALE, isValidLocale } from '@/i18n'
import {
  LOCALE_COOKIE,
  migrateLegacyLocale,
  readBrowserLocale,
} from '@/i18n/localePreference'

/** Kept in step with `server/utils/locales.ts`, which cannot be imported here:
 *  that file is bundled by Nitro and this one by Vite. */
const LOCALE_HEADER = 'x-app-locale'

/**
 * Installs vue-i18n, one instance per app.
 *
 * `src/main.ts` used to do this with the instance the i18n module created at
 * import time. On a server that module is evaluated once and an app is created
 * per request, so a shared instance would make one visitor's language every
 * concurrent visitor's. Step 5e of `docs/ssr-migration.md`.
 *
 * The language is resolved before the app exists and kept in `useState`, so
 * the server's answer travels to the browser in the payload and hydration
 * starts from the language the server rendered rather than working it out
 * again and possibly disagreeing.
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
 * **On a server it is already decided.** `server/middleware/locale.ts` reads
 * the cookie and `Accept-Language` and settles on one language per request,
 * because a cached route only sees the headers it varies on and neither of
 * those two is safe to key a cache by (step 5a). Reading its answer here is
 * also what keeps a cached page and a fresh one in the same language.
 *
 * **In the browser** the sources are still there to read: the language the
 * visitor chose, then the pre-cookie preference the #83 shim carries over,
 * then what the browser itself asks for.
 */
function resolveLocale(): string {
  if (import.meta.server) {
    const decided = useRequestHeaders([LOCALE_HEADER])[LOCALE_HEADER]
    return isValidLocale(decided) ? decided : DEFAULT_LOCALE
  }

  const chosen = useCookie(LOCALE_COOKIE).value
  if (isValidLocale(chosen)) return chosen

  const legacy = migrateLegacyLocale()
  if (isValidLocale(legacy)) return legacy

  const asked = readBrowserLocale()
  if (isValidLocale(asked)) return asked

  return DEFAULT_LOCALE
}
