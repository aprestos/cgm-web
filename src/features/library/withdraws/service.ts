import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'

export interface LibraryWithdraw {
  id: number
  library_game_id?: number
  library_game?: { game: { name: string; year: number; image: string } }
  tenant_id: string
  edition_id: number
  started_at: number
  ended_at: number
  user_id: string
  created_by: string
  notes?: string
  user?: { name?: string }
}

export const libraryWithdrawService = {
  async get(
    tenantId: string,
    editionId: number,
  ): Promise<Array<LibraryWithdraw>> {
    try {
      const result = await supabase
        .from('library_withdraws')
        .select(
          '*,user:profiles(name),library_game:library_games(game:games(name,year,image))',
        )
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)

      return result.data as LibraryWithdraw[]
    } catch (error) {
      logger.error('Error on libraryWithdrawService.get()', { error })
      return []
    }
  },

  async create(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase.from('library_withdraws').insert({
      tenant_id: tenantId,
      edition_id: editionId,
      library_game_id: libraryGameId,
      started_at: new Date().toISOString(),
      user_id: userId,
    })

    if (error) {
      throw new Error(`Failed to create withdraw: ${error.message}`)
    }
  },

  async returnGame(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<void> {
    // Update the active withdraw and return the updated record in a single operation
    const { error } = await supabase
      .from('library_withdraws')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('library_game_id', libraryGameId)
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .is('ended_at', null)

    if (error) {
      throw new Error(`Failed to return game: ${error.message}`)
    }
  },

  async getActiveByLibraryGameId(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<LibraryWithdraw | null> {
    try {
      const result = await supabase
        .from('library_withdraws')
        .select('*,user:profiles(name)')
        .eq('library_game_id', libraryGameId)
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .single<LibraryWithdraw>()

      return result.data
    } catch (error) {
      logger.error('Error fetching withdraws by library game:', { error })
      return null
    }
  },

  async getActiveWithdraws(
    tenantId: string,
    editionId: number,
  ): Promise<Array<LibraryWithdraw>> {
    try {
      const result = await supabase
        .from('library_withdraws')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })

      return result.data as LibraryWithdraw[]
    } catch (error) {
      logger.error('Error fetching active withdraws:', { error })
      return []
    }
  },

  async countByGame(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<number> {
    try {
      const result = await supabase
        .from('library_withdraws')
        .select('*', { count: 'exact', head: true })
        .eq('library_game_id', libraryGameId)
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)

      return result.count || 0
    } catch (error) {
      logger.error('Error counting withdraws by library game:', { error })
      return 0
    }
  },

  async getByUserId(
    tenantId: string,
    userId: string,
  ): Promise<Array<LibraryWithdraw>> {
    try {
      const result = await supabase
        .from('library_withdraws')
        .select(
          '*,library_game:library_games(game:games(name,year,image)),edition:editions(name)',
        )
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('started_at', { ascending: false })

      return result.data as LibraryWithdraw[]
    } catch (error) {
      logger.error('Error fetching withdraws by user:', { error })
      return []
    }
  },

  async getByLibraryGameId(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<LibraryWithdraw[]> {
    const { data, error } = await supabase
      .from('library_withdraws')
      .select('*,library_game:library_games(game:games(name,year,image))')
      .eq('library_game_id', libraryGameId)
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .order('started_at', { ascending: false })
      .overrideTypes<LibraryWithdraw[]>()

    if (error) {
      logger.error('Failed to withdraws by library game id', { error })
      return []
    }
    return data ?? []
  },
} as const

// Provide proper default export
export default libraryWithdrawService
