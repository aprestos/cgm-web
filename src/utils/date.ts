import { DateTime } from 'luxon'

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
    return `${startStr}–${endDay}`
  }

  // same year
  if (s.hasSame(e, 'year')) {
    return `${s.toLocaleString({
      month: 'long',
      day: 'numeric',
    })}–${e.toLocaleString({
      month: 'long',
      day: 'numeric',
    })}`
  }

  // different years
  return `${s.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}–${e.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`
}

export const formatDateRange = (
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string => {
  const formatter: Intl.DateTimeFormat & {
    formatRange?: (startDate: Date, endDate: Date) => string
  } = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  })

  if (!start || !end) {
    return '-'
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    typeof formatter.formatRange !== 'function'
  ) {
    return formatRange(start, end, locale)
  }

  return formatter.formatRange(startDate, endDate)
}

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
