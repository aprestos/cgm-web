import { DateTime } from 'luxon'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'

export enum SortOption {
  soonest = 'soonest',
  slots = 'slots',
  name = 'name',
}

// Cancelled tournaments are never shown, so the tabs cover the rest.
export const STATUS_TABS = [
  'all',
  TournamentStatus.scheduled,
  TournamentStatus.ongoing,
  TournamentStatus.finished,
] as const

export type StatusTab = (typeof STATUS_TABS)[number]

export type StatusCounts = Record<StatusTab, number>

export const slotsLeft = (tournament: Tournament): number =>
  Math.max(tournament.maxParticipants - tournament.participants, 0)

export const countByStatus = (tournaments: Tournament[]): StatusCounts => {
  const counts = {
    all: tournaments.length,
    [TournamentStatus.scheduled]: 0,
    [TournamentStatus.ongoing]: 0,
    [TournamentStatus.finished]: 0,
  }

  for (const tournament of tournaments) {
    if (tournament.status in counts) {
      counts[tournament.status as StatusTab]++
    }
  }

  return counts
}

export const filterTournaments = (
  tournaments: Tournament[],
  status: StatusTab,
  searchQuery: string,
): Tournament[] => {
  const query = searchQuery.trim().toLowerCase()

  return tournaments.filter((tournament) => {
    if (status !== 'all' && tournament.status !== status) {
      return false
    }

    if (!query) return true

    return (
      tournament.title.toLowerCase().includes(query) ||
      (tournament.organizer ?? '').toLowerCase().includes(query) ||
      (tournament.place ?? '').toLowerCase().includes(query)
    )
  })
}

export const sortTournaments = (
  tournaments: Tournament[],
  sort: SortOption,
): Tournament[] =>
  [...tournaments].sort((a, b) => {
    switch (sort) {
      case SortOption.slots:
        return slotsLeft(b) - slotsLeft(a)
      case SortOption.name:
        return a.title.localeCompare(b.title)
      default:
        return (
          DateTime.fromISO(a.startsAt).toMillis() -
          DateTime.fromISO(b.startsAt).toMillis()
        )
    }
  })
