import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The three reads that turn a hostname into a tenant's current configuration.
 *
 * They live here because two different halves of the app make them and neither
 * can import the other's copy. the services under `src/features` are bundled by Vite
 * and reaches for `src/lib/supabase.ts`, which reads `import.meta.env` and
 * checks `typeof window`; `server/routes/sitemap.xml.ts` is bundled by Nitro,
 * where neither of those exists. Until step 6's cleanup they were written out
 * twice, and a column rename would have had to find both.
 *
 * Only the queries are shared. What each side does with a row — mapping it to
 * a model, falling back to a dev tenant, deciding whether to log — stays with
 * the caller, because those answers genuinely differ.
 *
 * Each function answers the row or null and throws whatever the database said,
 * leaving the caller to decide whether that is fatal.
 */

/** A `tenant_domains` row with the tenant it resolves to embedded. */
export interface TenantDomainRow {
  tenants: Record<string, unknown> | null
}

/**
 * Only an active hostname resolves, so a domain still being verified cannot
 * serve a tenant before its ownership has been confirmed.
 */
export async function findTenantDomain(
  client: SupabaseClient,
  hostname: string,
): Promise<TenantDomainRow | null> {
  const { data, error } = await client
    .from('tenant_domains')
    .select('tenants(*)')
    .eq('hostname', hostname)
    .eq('status', 'active')
    .maybeSingle<TenantDomainRow>()

  if (error) throw error
  return data
}

/**
 * `maybeSingle`, not `single`: a tenant that has been created but has not set
 * up an edition yet is a normal state, not an error.
 */
export async function findCurrentEdition(
  client: SupabaseClient,
  tenantId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .from('editions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('current', true)
    .maybeSingle<Record<string, unknown>>()

  if (error) throw error
  return data
}

/** A `settings` row, as the table stores it. */
export interface SettingRow {
  type: string
  enabled: boolean
  content?: unknown
}

/** Only the features that are switched on; the rest are the same as absent. */
export async function findEnabledSettings(
  client: SupabaseClient,
  tenantId: string,
  editionId: number,
): Promise<SettingRow[]> {
  const { data, error } = await client
    .from('settings')
    .select()
    .eq('tenant_id', tenantId)
    .eq('edition_id', editionId)
    .eq('enabled', true)

  if (error) throw error
  return (data ?? []) as SettingRow[]
}
