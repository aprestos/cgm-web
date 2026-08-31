import type { LocalizedString } from '@/utils/localizedString.ts'

// Values match the `tournament_format` Postgres enum verbatim.
export enum TournamentFormat {
  singleElimination = 'single-elimination',
  doubleElimination = 'double-elimination',
  consolation = 'consolation',
  roundRobin = 'round-robin',
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

/**
 * A partial write. The optional columns take `null` to clear them, which
 * `undefined` cannot express — leaving a key out means "do not touch it".
 */
export type UpdateTournament = Partial<
  Omit<CreateTournament, 'prizes' | 'description' | 'cover' | 'thumbnail'>
> & {
  prizes?: Record<TournamentPrizeType, LocalizedString> | null
  description?: string | null
  cover?: string | null
  thumbnail?: string | null
}
