export interface CreateTournamentParticipant {
  participantName?: string
  participantEmail?: string
  /** Set instead of the name/email when the sign-up is backed by a ticket */
  ticketIssuanceId?: string
}

export type TournamentParticipant = CreateTournamentParticipant & {
  id: string
  tournamentId: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
  }
  /** Attendee behind the ticket, when the sign-up is backed by one */
  ticketIssuance?: {
    attendeeName: string
    attendeeEmail: string
  } | null
}

/**
 * Ticket-backed sign-ups carry no name of their own, so the attendee on the
 * ticket stands in for it.
 */
export function participantDisplayName(
  participant: TournamentParticipant,
): string {
  return (
    participant.participantName?.trim() ||
    participant.ticketIssuance?.attendeeName?.trim() ||
    participant.participantEmail?.trim() ||
    participant.ticketIssuance?.attendeeEmail?.trim() ||
    ''
  )
}

/**
 * Initials for avatar fallbacks: first and last word, so "Ana Maria Silva"
 * gives "AS". Names can fall back to an email, which has no words to speak
 * of — those get a single letter rather than a mangled pair.
 */
export function participantInitials(displayName: string): string {
  const words = displayName.split(/\s+/).filter(Boolean)
  if (!words.length) return '?'

  const first = words[0]?.charAt(0) ?? ''
  const last =
    words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : ''

  return (first + last).toUpperCase()
}
