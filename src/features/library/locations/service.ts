import { supabase } from '@/lib/supabase.ts'
import { useEditionStore } from '@/features/events/edition.store'
import { useTenantStore } from '@/features/tenant/tenant.store'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import logger from '@/lib/logger.ts'

export const libraryLocationService = {
  async search(query: string): Promise<Array<LibraryLocation>> {
    try {
      const result = await supabase
        .from('locations')
        .select('*')
        .eq('tenant_id', useTenantStore().tenant?.id)
        .eq('edition_id', useEditionStore().edition?.id)
        .ilike('name', `%${query}%`)

      return result.data as LibraryLocation[]
    } catch (error) {
      console.error('Search error:', (error as Error).message)
      return []
    }
  },
  async get(): Promise<Array<LibraryLocation>> {
    try {
      const result = await supabase
        .from('locations')
        .select('*')
        .eq('tenant_id', useTenantStore().tenant?.id)
        .eq('edition_id', useEditionStore().edition?.id)

      return result.data as LibraryLocation[]
    } catch (error) {
      console.error('get error:', (error as Error).message)
      return []
    }
  },
  async create(name: string): Promise<LibraryLocation | null> {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        tenant_id: useTenantStore().tenant?.id,
        edition_id: useEditionStore().edition?.id,
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
