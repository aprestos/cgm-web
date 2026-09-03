import { supabase } from '@/lib/supabase'
import { toCamelCaseAs, toSnakeCaseAs } from '@/utils/caseConverter'
import type {
  CreateTournamentParticipant,
  TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import logger from '@/lib/logger.ts'

export const tournamentParticipantsService = {
  async create(
    tenantId: string,
    editionId: number,
    tournamentId: string,
    participants: CreateTournamentParticipant[],
  ): Promise<void> {
    if (!participants.length) return

    const { error } = await supabase.functions.invoke(
      'tournaments/participants',
      {
        headers: {
          'tenant-id': tenantId,
          'edition-id': String(editionId),
        },
        body: {
          tournament_id: tournamentId,
          participants: toSnakeCaseAs<Record<string, unknown>[]>(
            participants as Record<string, unknown>[],
          ),
        },
      },
    )

    if (error) {
      logger.error('Fail to assign participants to a tournament', {
        tenantId,
        editionId,
        tournamentId,
        participants,
        error,
      })
      throw new Error('Unable to join tournament')
    }
  },

  async getAllByTournament(
    tenantId: string,
    editionId: number,
    tournamentId: string,
  ): Promise<TournamentParticipant[]> {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(
        // Ticket-backed sign-ups keep the name on the issuance, and `user` is
        // the account that registered the participant, not the participant.
        '*, ticketIssuance:ticket_issuances(attendee_name, attendee_email), user:profiles(id, name, email)',
      )
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Unable to load tournament participants', {
        tenantId,
        editionId,
        tournamentId,
        error,
      })
      throw new Error('Unable to load tournament participants')
    }

    return data ? toCamelCaseAs<TournamentParticipant>(data) : []
  },

  async getAllByUser(
    tenantId: string,
    editionId: number,
    userId: string | undefined,
  ): Promise<TournamentParticipant[]> {
    if (!userId) return []
    const { data, error } = await supabase
      .from('tournament_participants')
      // Ticket-backed sign-ups keep the name on the issuance, not on the row.
      .select(
        '*, ticketIssuance:ticket_issuances(attendee_name, attendee_email)',
      )
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('user_id', userId)

    if (error) {
      logger.error('Unable to load participants', {
        tenantId,
        editionId,
        userId,
        error,
      })
      throw new Error('Unable to load participants')
    }
    return data ? toCamelCaseAs<TournamentParticipant>(data) : []
  },

  // TODO: removing a participant has to go through an edge function — the row
  // and the tournament participant count have to come down together, which a
  // plain table delete from the client cannot do.
}

export default tournamentParticipantsService
