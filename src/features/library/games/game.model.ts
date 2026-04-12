import type { Game } from '@/features/external-game/model.ts'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import { DateTime } from 'luxon'
import { i18n } from '@/i18n'

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

export const getStatusLabel = (game: LibraryGame): string => {
  const status = getStatus(game)
  const { t } = i18n.global

  switch (status) {
    case 'withdrawn':
      return t('game.withdrawn')
    case 'reserved':
      return t('game.reserved')
    case 'not-available':
      return t('game.notAvailable')
    case 'available':
      return t('game.available')
    default:
      return ''
  }
}
