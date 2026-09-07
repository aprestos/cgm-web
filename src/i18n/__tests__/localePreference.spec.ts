import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCALE_COOKIE,
  migrateLegacyLocale,
  readStoredLocale,
  storeLocale,
} from '../localePreference'

function clearCookie(): void {
  document.cookie = `${LOCALE_COOKIE}=; Path=/; Max-Age=0`
}

/**
 * jsdom does not give this suite a localStorage, so the legacy path gets a
 * minimal one. Only the three methods the migration touches are needed.
 */
function stubLocalStorage(): Storage {
  const entries = new Map<string, string>()
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length(): number {
      return entries.size
    },
  }
}

describe('localePreference', () => {
  beforeEach(() => {
    clearCookie()
    vi.stubGlobal('localStorage', stubLocalStorage())
  })

  afterEach(() => {
    clearCookie()
    vi.unstubAllGlobals()
  })

  describe('readStoredLocale', () => {
    it('answers null when nothing has been stored', () => {
      expect(readStoredLocale()).toBeNull()
    })

    it('reads back what storeLocale wrote', () => {
      storeLocale('pt')
      expect(readStoredLocale()).toBe('pt')
    })

    // The cookie is read out of a single string holding every cookie for the
    // host, so a neighbour whose name ends in the one we want must not match.
    it('does not confuse a cookie whose name ends with the key', () => {
      document.cookie = `not-the-${LOCALE_COOKIE}=pt; Path=/`
      expect(readStoredLocale()).toBeNull()
      document.cookie = `not-the-${LOCALE_COOKIE}=; Path=/; Max-Age=0`
    })

    it('finds the cookie when other cookies precede it', () => {
      document.cookie = 'unrelated=1; Path=/'
      storeLocale('en')
      expect(readStoredLocale()).toBe('en')
      document.cookie = 'unrelated=; Path=/; Max-Age=0'
    })
  })

  describe('migrateLegacyLocale', () => {
    it('answers null when there is no pre-cookie preference', () => {
      expect(migrateLegacyLocale()).toBeNull()
    })

    it('moves a localStorage preference into the cookie and clears it', () => {
      localStorage.setItem(LOCALE_COOKIE, 'pt')

      expect(migrateLegacyLocale()).toBe('pt')
      expect(readStoredLocale()).toBe('pt')
      expect(localStorage.getItem(LOCALE_COOKIE)).toBeNull()
    })

    it('has nothing left to do on a second run', () => {
      localStorage.setItem(LOCALE_COOKIE, 'pt')
      migrateLegacyLocale()

      expect(migrateLegacyLocale()).toBeNull()
      expect(readStoredLocale()).toBe('pt')
    })
  })
})
