import { describe, it, expect } from 'vitest'
import en from '@/i18n/locales/en'
import pt from '@/i18n/locales/pt'
import { AVAILABLE_LOCALE_CODES, i18n } from '@/i18n'

type Messages = Record<string, unknown>

function collectOrphans(
  partial: Messages,
  base: Messages,
  prefix: string,
  orphans: string[],
): void {
  for (const [key, value] of Object.entries(partial)) {
    const path = prefix ? `${prefix}.${key}` : key
    const baseValue = base[key]
    if (baseValue === undefined) {
      orphans.push(path)
      continue
    }
    const valueIsObject = typeof value === 'object' && value !== null
    const baseIsObject = typeof baseValue === 'object' && baseValue !== null
    if (valueIsObject !== baseIsObject) {
      orphans.push(`${path} (type mismatch)`)
      continue
    }
    if (valueIsObject && baseIsObject) {
      collectOrphans(value as Messages, baseValue as Messages, path, orphans)
    }
  }
}

describe('locale catalogs', () => {
  // Missing pt keys are fine (they fall back to English), but every pt key
  // must exist in en with the same shape — otherwise it is dead weight or a
  // sign the en catalog moved and pt was left behind.
  it('pt contains no keys that are absent from en', () => {
    const orphans: string[] = []
    collectOrphans(pt, en, '', orphans)
    expect(orphans).toEqual([])
  })

  it('loader discovers all locale directories and resolves messages', () => {
    expect(AVAILABLE_LOCALE_CODES).toContain('en')
    expect(AVAILABLE_LOCALE_CODES).toContain('pt')
    expect(i18n.global.getLocaleMessage('en')).toMatchObject({
      common: { actions: { cancel: 'Cancel' } },
    })
    expect(i18n.global.getLocaleMessage('pt')).toMatchObject({
      public: { game: { status: { available: 'Disponível' } } },
    })
  })

  it('en top-level namespaces follow the agreed structure', () => {
    expect(Object.keys(en).sort()).toEqual([
      'admin',
      'auth',
      'common',
      'landing',
      'public',
    ])
  })
})
