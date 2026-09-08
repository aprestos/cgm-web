import { supabase } from '@/lib/supabase'
import type { Edition } from '@/features/events/edition.model.ts'

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
  /**
   * The edition the tenant is currently showing, or null when it has none.
   *
   * `maybeSingle` rather than `single`: a tenant that has been created but
   * has not set up an edition yet is a normal state, not an error. Under the
   * SPA the thrown error left that tenant's site a blank page, because startup
   * never reached `mount()`; on a server it was a 500. Every caller already
   * takes null — the return type has always said so.
   */
  async getCurrentEdition(tenantId: string): Promise<Edition | null> {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('current', true)
      .maybeSingle<Edition>()
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
