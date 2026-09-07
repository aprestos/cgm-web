/**
 * Where the visitor's chosen language is kept, and how it is read back.
 *
 * A cookie rather than localStorage: the language decides what the very first
 * paint says, so a server rendering the page has to know it before it renders.
 * A request carries its cookies; localStorage never leaves the browser, so a
 * preference kept there would render every page in the default language and
 * then switch after hydration.
 *
 * Nothing here assumes a browser. On a server every read answers null and the
 * caller falls back, which is what lets this module be imported at module
 * scope — the previous code read `localStorage` while building the i18n
 * instance, which throws the moment there is no browser.
 */

export const LOCALE_COOKIE = 'app-locale'

/** A year: long enough that a returning visitor keeps their language. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/** Reads the stored language, or null when there is none or no browser. */
export function readStoredLocale(): string | null {
  if (typeof document === 'undefined') return null

  const prefix = `${LOCALE_COOKIE}=`
  for (const entry of document.cookie.split(';')) {
    const cookie = entry.trim()
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length)) || null
    }
  }

  return null
}

/** Persists the chosen language. A no-op off the browser. */
export function storeLocale(code: string): void {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${LOCALE_COOKIE}=${encodeURIComponent(code)}` +
    `; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

/**
 * The language the browser itself asks for, as a bare code (`pt-BR` -> `pt`).
 *
 * Only a hint: the caller decides whether it is a language we actually have.
 */
export function readBrowserLocale(): string | null {
  if (typeof navigator === 'undefined') return null

  try {
    return navigator.language.split('-')[0] || null
  } catch {
    return null
  }
}

/**
 * Moves a language chosen before the switch to cookies out of localStorage.
 *
 * Without this the change silently resets everyone's language to the default.
 * Runs once per visitor: the localStorage copy is dropped as soon as it has
 * been written as a cookie.
 */
export function migrateLegacyLocale(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(LOCALE_COOKIE)
    if (!saved) return null

    storeLocale(saved)
    localStorage.removeItem(LOCALE_COOKIE)
    return saved
  } catch {
    // A blocked or unavailable localStorage just means no preference to carry.
    return null
  }
}
