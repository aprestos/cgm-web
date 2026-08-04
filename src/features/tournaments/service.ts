import { supabase } from '@/lib/supabase'
import { toCamelCaseAs, toSnakeCaseAs } from '@/utils/caseConverter'
import type {
  CreateTournament,
  Tournament,
} from '@/features/tournaments/model.ts'

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
}

export default tournamentService
