import type { Tenant } from '@/features/tenant/tenant.model.ts'
import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs, toSnakeCase } from '@/utils/caseConverter.ts'

// Anything that is not a plain hostname cannot be one we serve, so it is
// rejected before it costs a round trip.
const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/

/** A tenant_domains row with the tenant it resolves to embedded. */
type ResolvedDomain = { tenants: Record<string, unknown> | null }

export const tenantService = {
  async getByDomain(domain: string): Promise<Tenant> {
    const hostname = domain.trim().toLowerCase()

    try {
      if (!HOSTNAME.test(hostname)) {
        throw new Error(`Invalid hostname: ${domain}`)
      }

      // One round trip: find the hostname, embed the tenant it belongs to.
      // Only active hostnames resolve, so a domain still being verified cannot
      // serve a tenant before its ownership has been confirmed.
      const { data } = await supabase
        .from('tenant_domains')
        .select('tenants(*)')
        .eq('hostname', hostname)
        .eq('status', 'active')
        .maybeSingle<ResolvedDomain>()

      if (data?.tenants) {
        return toCamelCaseAs<Tenant>(data.tenants)
      }

      // Development only. In production an unrecognised host is a domain we do
      // not serve, and must never resolve to somebody else's tenant.
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_TENANT_ID) {
        const devTenant = await this.getById(import.meta.env.VITE_DEV_TENANT_ID)
        if (devTenant) {
          return devTenant
        }
      }

      throw new Error(`No tenant found for domain: ${hostname}`)
    } catch (error) {
      logger.error('Error on tenantService.getByDomain()', { error })
      throw error
    }
  },
  async getById(id: string): Promise<Tenant | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select()
        .eq('id', id)
        .single()
      if (error) {
        logger.error('Unable to fetch tenant', { id, error })
        return null
      }
      return data ? toCamelCaseAs<Tenant>(data) : null
    } catch (error) {
      console.error((error as Error).message)
      return null
    }
  },
  async updateTenant(
    tenantId: string,
    updates: Partial<Tenant>,
  ): Promise<Tenant | null> {
    // Filter out undefined values to only update defined fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    )

    // If no valid updates, return null
    if (Object.keys(filteredUpdates).length === 0) {
      logger.info('No valid updates provided for tenant')
      return null
    }

    const { data, error } = await supabase
      .from('tenants')
      .update(toSnakeCase(filteredUpdates))
      .eq('id', tenantId)
      .select()
      .single<Tenant>()

    if (error) {
      logger.error('Error updating tenant:', { error })
      throw new Error(
        'An error occurred while updating the tenant. Try again later.',
      )
    }

    return data
  },
}

export default tenantService
