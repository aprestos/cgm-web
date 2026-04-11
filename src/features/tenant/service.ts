import type { Tenant } from '@/features/tenant/tenant.model.ts'
import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCase, toSnakeCase } from '@/utils/caseConverter.ts'

export const tenantService = {
  async get(): Promise<Array<Tenant>> {
    try {
      const result = await supabase.from('tenants').select('id,name,domain')
      return result.data as Tenant[]
    } catch (error) {
      logger.error('Error on tenantService.get()', { error })
      return []
    }
  },
  async getByDomain(domain: string): Promise<Tenant> {
    try {
      const normalizedDomain = domain.toLowerCase()

      // Try exact match for the domain or in other_domains array
      const { data } = await supabase
        .from('tenants')
        .select()
        .or(
          `domain.eq.${normalizedDomain},other_domains.cs.{${normalizedDomain}}`,
        )
        .single()

      if (data) {
        return toCamelCase(data) as Tenant
      }

      // If not found and dev tenant ID is configured, use that as fallback
      if (import.meta.env.VITE_DEV_TENANT_ID) {
        const devTenant = await this.getById(import.meta.env.VITE_DEV_TENANT_ID)
        if (devTenant) {
          return devTenant
        }
      }

      throw new Error(`No tenant found for domain: ${domain}`)
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
      return data ? (toCamelCase(data) as Tenant) : null
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
