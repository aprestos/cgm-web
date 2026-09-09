import { DateTime } from 'luxon'

/**
 * What goes between the two ends of a date range.
 *
 * Ours rather than `Intl.DateTimeFormat.formatRange`'s, because that separator
 * is an ICU detail and Node's ICU is not the browser's: Node 26 pads the en
 * dash with U+2009 THIN SPACE, Chrome pads it with a plain U+0020. The two
 * strings look identical and are not, so a server-rendered range mismatched
 * every time the browser hydrated it — see step 5c of `docs/ssr-migration.md`,
 * which had it recorded as a timezone difference.
 */
const RANGE_SEPARATOR = ' – '

export const formatRange = (
  start: string,
  end: string,
  locale: string,
): string => {
  const s = DateTime.fromISO(start).setLocale(locale)
  const e = DateTime.fromISO(end).setLocale(locale)

  // same day
  if (s.hasSame(e, 'day')) {
    return s.toLocaleString({
      month: 'long',
      day: 'numeric',
    })
  }

  // same month + year
  if (s.hasSame(e, 'month') && s.hasSame(e, 'year')) {
    const startStr = s.toLocaleString({
      month: 'long',
      day: 'numeric',
    })
    const endDay = e.toLocaleString({
      day: 'numeric',
    })
    return `${startStr}${RANGE_SEPARATOR}${endDay}`
  }

  // same year
  if (s.hasSame(e, 'year')) {
    return `${s.toLocaleString({
      month: 'long',
      day: 'numeric',
    })}${RANGE_SEPARATOR}${e.toLocaleString({
      month: 'long',
      day: 'numeric',
    })}`
  }

  // different years
  return `${s.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}${RANGE_SEPARATOR}${e.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`
}

/**
 * A date range, formatted the same way wherever it runs.
 *
 * This used to prefer `Intl.DateTimeFormat.formatRange` and fall back to
 * `formatRange`. The native one is now unreachable on purpose: it gave the
 * server and the browser two different strings (see `RANGE_SEPARATOR`), and it
 * read its ends through `new Date`, which parses a date-only ISO string as UTC
 * midnight and then prints it in the local zone — so `2026-12-28` was already
 * December 27th for a visitor west of Greenwich. `formatRange` parses with
 * Luxon, which takes a date-only string as a local date and leaves it alone.
 */
export const formatDateRange = (
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string => {
  if (!start || !end) {
    return '-'
  }

  return formatRange(start, end, locale)
}

export const getTicketDays = (
  validFrom: string | undefined,
  validUntil: string | undefined,
  locale = 'en',
): string[] => {
  if (!validFrom || !validUntil) return []

  const start = DateTime.fromISO(validFrom).startOf('day')
  const end = DateTime.fromISO(validUntil).startOf('day')

  if (!start.isValid || !end.isValid || end < start) return []

  const days: string[] = []
  let current = start
  while (current <= end) {
    days.push(current.setLocale(locale).toLocaleString({ weekday: 'short' }))
    current = current.plus({ days: 1 })
  }

  return days
}

export const formatDayLabel = (day: string, locale: string): string =>
  DateTime.fromISO(day).setLocale(locale).toLocaleString({
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

export const formatWeekday = (
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string => {
  if (!start || !end) {
    return '-'
  }

  const startDate = DateTime.fromISO(start).startOf('day')
  const endDate = DateTime.fromISO(end).startOf('day')

  if (!startDate.isValid || !endDate.isValid || endDate < startDate) {
    return '-'
  }

  if (startDate.hasSame(endDate, 'day')) {
    return startDate.setLocale(locale).toLocaleString({
      weekday: 'long',
    })
  }

  const dayCount = Math.floor(endDate.diff(startDate, 'days').days) + 1
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'day',
    unitDisplay: 'long',
  }).format(dayCount)
}
