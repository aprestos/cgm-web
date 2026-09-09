import type { Game } from '@/features/external-game/model.ts'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import { DateTime } from 'luxon'

export enum LibraryGameStatus {
  available = 'available',
  reserved = 'reserved',
  notAvailable = 'not-available',
  withdrawn = 'withdrawn',
}

export interface LibraryGame {
  id: number
  owner: string
  notes: string
  editionId: number
  location?: LibraryLocation
  game: Game
  status: LibraryGameStatus
  reservedUntil?: string
}

export const getStatus = (game: LibraryGame | null): string => {
  if (!game) return ''

  if (game.status === LibraryGameStatus.reserved) {
    if (
      game.reservedUntil &&
      DateTime.fromISO(game.reservedUntil).plus({ minute: 1 }).toMillis() >
        DateTime.now().toMillis()
    ) {
      return 'reserved'
    } else {
      return 'available'
    }
  } else {
    return game.status
  }
}

export const getStatusColor = (game: LibraryGame): string => {
  const status = getStatus(game)

  switch (status) {
    case 'withdrawn':
      return 'from-amber-700'
    case 'reserved':
      return 'from-blue-700'
    case 'not-available':
      return 'from-red-700'
    default:
      return ''
  }
}

/**
 * `t` is a parameter rather than something this module reaches for.
 *
 * It used to read `i18n.global` off the shared instance, which stopped
 * existing when i18n became one instance per app in step 5e — and would have
 * answered in whichever request's language happened to be current if it had
 * survived. Same fix as the services got in 4c: the caller has the context, so
 * the caller passes it.
 */
export const getStatusLabel = (
  game: LibraryGame,
  t: (key: string) => string,
): string => {
  const status = getStatus(game)

  switch (status) {
    case 'withdrawn':
      return t('public.game.status.withdrawn')
    case 'reserved':
      return t('public.game.status.reserved')
    case 'not-available':
      return t('public.game.status.notAvailable')
    case 'available':
      return t('public.game.status.available')
    default:
      return ''
  }
}
