import { supabase } from '@/lib/supabase.ts'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import logger from '@/lib/logger.ts'

export const libraryLocationService = {
  async search(
    tenantId: string,
    editionId: number,
    query: string,
  ): Promise<Array<LibraryLocation>> {
    try {
      const result = await supabase
        .from('locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)
        .ilike('name', `%${query}%`)

      return result.data as LibraryLocation[]
    } catch (error) {
      console.error('Search error:', (error as Error).message)
      return []
    }
  },
  async get(
    tenantId: string,
    editionId: number,
  ): Promise<Array<LibraryLocation>> {
    try {
      const result = await supabase
        .from('locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)

      return result.data as LibraryLocation[]
    } catch (error) {
      console.error('get error:', (error as Error).message)
      return []
    }
  },
  async create(
    tenantId: string,
    editionId: number,
    name: string,
  ): Promise<LibraryLocation | null> {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        tenant_id: tenantId,
        edition_id: editionId,
        name,
      })
      .select()
      .single<LibraryLocation>()

    if (error) {
      logger.error('Failed to create location', { error })
      throw new Error('Failed to create location.')
    }

    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id)

    if (error) {
      logger.error('Failed to delete location', { error })
      throw new Error('Failed to delete location.')
    }
  },
} as const
