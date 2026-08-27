import { supabase } from '@/lib/supabase'
import { toCamelCaseAs, toSnakeCaseAs } from '@/utils/caseConverter'
import type {
  CreateTournament,
  Tournament,
} from '@/features/tournaments/tournament.model.ts'
import type {
  CreateTournamentParticipant,
  TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import logger from '@/lib/logger.ts'

export const tournamentService = {
  async get(
    tenantId: string,
    editionId: number,
    id: string,
  ): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournament_events')
      .select('*')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error) throw error
    return toCamelCaseAs<Tournament>(data)
  },

  async getAll(tenantId: string, editionId: number): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from('tournament_events')
      .select('*')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return toCamelCaseAs<Tournament>(data ?? [])
  },

  async create(
    tenantId: string,
    editionId: number,
    input: CreateTournament,
  ): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournament_events')
      .insert({
        tenant_id: tenantId,
        edition_id: editionId,
        ...toSnakeCaseAs<Record<string, unknown>>(
          input as unknown as Record<string, unknown>,
        ),
      })
      .select()
      .single()

    if (error) throw error

    return toCamelCaseAs<Tournament>(data)
  },

  async join(
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

  async getParticipantsByUser(
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
}

export default tournamentService
