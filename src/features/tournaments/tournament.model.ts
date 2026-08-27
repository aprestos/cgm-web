import type { LocalizedString } from '@/utils/localizedString.ts'

export enum TournamentFormat {
  singleElimination = 'single-elimination',
  doubleElimination = 'double-elimination',
  consolation = 'consolation',
}

export enum TournamentStatus {
  scheduled = 'scheduled',
  ongoing = 'ongoing',
  finished = 'finished',
  cancelled = 'cancelled',
}

export enum TournamentPrizeType {
  first = 'first',
  second = 'second',
  third = 'third',
  all = 'all',
  others = 'others',
}

export interface CreateTournament {
  title: string
  place: string
  startsAt: string
  participants: number
  maxParticipants: number
  organizer: string
  format: TournamentFormat
  status: TournamentStatus
  prizes?: Record<TournamentPrizeType, LocalizedString>
  description?: string
  cover?: string
  thumbnail?: string
}

export type Tournament = CreateTournament & {
  id: string
}
