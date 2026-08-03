import type { JWTPayload } from 'jose'
import { compactVerify, importSPKI } from 'jose'
import { DateTime } from 'luxon'
import { formatDateRange } from '@/utils/date'

type SPKIKey = Awaited<ReturnType<typeof importSPKI>>

let _publicKey: SPKIKey | null = null

async function getPublicKey(): Promise<SPKIKey> {
  if (_publicKey) return _publicKey
  const b64 = import.meta.env.VITE_TICKETS_PUBLIC_KEY as string
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`
  _publicKey = await importSPKI(pem, 'EdDSA')
  return _publicKey
}

export async function verifyTicketQR(rawValue: string): Promise<JWTPayload> {
  const key = await getPublicKey()
  const { payload: rawPayload } = await compactVerify(rawValue, key)
  const payload = JSON.parse(new TextDecoder().decode(rawPayload)) as JWTPayload

  if (payload.exp !== undefined && payload.exp < Date.now() / 1000) {
    throw new Error('Ticket has expired')
  }

  return payload
}

export function getTicketTitle(
  days: Array<{ day: string }> | undefined,
  locale: string,
  weekendLabel: string,
): {
  weekday: string
  displayDate: string
} {
  if (!days) return { weekday: '-', displayDate: '-' }

  const dates = days
    .map(({ day }) => DateTime.fromISO(day).startOf('day'))
    .filter((date) => date.isValid)
    .sort((a, b) => a.toMillis() - b.toMillis())

  if (dates.length === 0) {
    return { weekday: '-', displayDate: '-' }
  }

  const first = dates[0]
  const last = dates[dates.length - 1]

  const isWeekend =
    dates.length === 2 &&
    first.weekday === 6 &&
    last.weekday === 7 &&
    last.diff(first, 'days').days === 1

  let weekday: string
  if (isWeekend) {
    weekday = weekendLabel
  } else if (dates.length === 1) {
    weekday = first.setLocale(locale).toLocaleString({ weekday: 'long' })
  } else {
    weekday = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'day',
      unitDisplay: 'long',
    }).format(dates.length)
  }

  const displayDate = formatDateRange(
    first.toISODate(),
    last.toISODate(),
    locale,
  )

  return { weekday, displayDate }
}
