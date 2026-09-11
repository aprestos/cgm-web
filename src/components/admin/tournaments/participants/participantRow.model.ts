import { DateTime } from 'luxon'
import {
  participantDisplayName,
  participantEmail,
  participantInitials,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'

/** Flattened for the table: sorting and searching both work off these fields. */
export interface ParticipantRow {
  id: string
  name: string
  email: string
  joinedAt: string
  joinedLabel: string
  signedUpBy: string
  initials: string
  fromTicket: boolean
}

/**
 * The locale and the fallback label are handed in rather than read from
 * `useI18n` here, so this stays a plain function the table can map over inside
 * a computed.
 */
export function toParticipantRow(
  participant: TournamentParticipant,
  locale: string,
  unnamedLabel: string,
): ParticipantRow {
  const name = participantDisplayName(participant) || unnamedLabel

  return {
    id: participant.id,
    name,
    email: participantEmail(participant),
    joinedAt: participant.createdAt,
    joinedLabel: DateTime.fromISO(participant.createdAt)
      .setLocale(locale)
      .toLocaleString(DateTime.DATETIME_MED),
    // The account behind the sign-up, which is not always the participant.
    signedUpBy: participant.user?.name || participant.user?.email || '',
    initials: participantInitials(name),
    fromTicket: !!participant.ticketIssuanceId,
  }
}

/** The search box matches the two columns an admin would type into it. */
export function matchesQuery(row: ParticipantRow, query: string): boolean {
  return (
    row.name.toLowerCase().includes(query) ||
    row.email.toLowerCase().includes(query)
  )
}
