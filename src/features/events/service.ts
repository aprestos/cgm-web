import { supabase } from '@/lib/supabase'
import type { Edition } from '@/features/events/event.model.ts'

export const editionService = {
  async getById(eventId: string): Promise<Edition | null> {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('id', eventId)
      .single<Edition>()
    if (error) throw error
    return data
  },
  async getCurrentEdition(tenantId: string): Promise<Edition | null> {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('current', true)
      .single<Edition>()
    if (error) throw error
    return data
  },
  async save(
    tenantId: string | undefined,
    editionId: number | undefined,
    update: unknown,
  ): Promise<void> {
    if (!tenantId || !editionId || !update) return

    const { error } = await supabase
      .from('editions')
      .update(update)
      .eq('tenant_id', tenantId)
      .eq('id', editionId)
    if (error) throw error
  },
}
