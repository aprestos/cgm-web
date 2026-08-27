export type LocalizedString = Record<string, string>

/**
 * Picks the best translation available for the current locale.
 *
 * Values are written in whatever language the author happened to be using —
 * a prize typed in `pt` has no `en` key at all — so falling through to
 * something readable beats showing nothing: exact locale, then any variant of
 * the same language (`pt-PT` matches `pt`), then the first value present.
 */
export function resolveLocalized(
  value: LocalizedString | undefined,
  locale: string,
): string {
  if (!value) return ''

  const exact = value[locale]?.trim()
  if (exact) return exact

  const language = locale.split('-')[0] ?? locale
  const sameLanguage = Object.entries(value).find(
    ([key, text]) => key.split('-')[0] === language && text?.trim(),
  )
  if (sameLanguage) return sameLanguage[1].trim()

  return (
    Object.values(value)
      .find((text) => text?.trim())
      ?.trim() ?? ''
  )
}
