import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'
import type { TenantDomain } from './domain.model.ts'

/**
 * The edge function answers a failure with `{ error, message }` and a real
 * status code, but supabase-js collapses that into a generic
 * FunctionsHttpError and hides the body on `context`. Digging it out is what
 * turns "Edge Function returned a non-2xx status code" into "that domain is
 * already registered".
 */
const messageFromError = async (error: unknown): Promise<string | null> => {
  const context = (error as { context?: Response }).context
  if (!context || typeof context.json !== 'function') {
    return null
  }
  try {
    const body = (await context.json()) as { message?: string }
    return body.message ?? null
  } catch {
    return null
  }
}

const invoke = async <T>(
  path: string,
  method: 'POST' | 'DELETE',
  body?: Record<string, unknown>,
): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>(path, {
    method,
    ...(body ? { body } : {}),
  })

  if (error) {
    const message = await messageFromError(error)
    logger.error('Domain request failed', { path, method, error, message })
    throw new Error(message ?? 'Something went wrong. Please try again.')
  }

  return data as T
}

export const domainsService = {
  async getByTenant(tenantId: string): Promise<TenantDomain[]> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .select()
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('hostname', { ascending: true })

    if (error) {
      logger.error('Error on domainsService.getByTenant()', { error })
      throw new Error('Unable to load domains')
    }

    return toCamelCaseAs<TenantDomain>(data ?? [])
  },

  async add(tenantId: string, hostname: string): Promise<TenantDomain> {
    const created = await invoke<Record<string, unknown>>('domains', 'POST', {
      tenant_id: tenantId,
      hostname,
    })
    return toCamelCaseAs<TenantDomain>(created)
  },

  /** Asks the provider where the domain got to and stores the answer. */
  async refresh(id: number): Promise<TenantDomain> {
    const refreshed = await invoke<Record<string, unknown>>(
      `domains/${id}/refresh`,
      'POST',
    )
    return toCamelCaseAs<TenantDomain>(refreshed)
  },

  async remove(id: number): Promise<void> {
    await invoke<null>(`domains/${id}`, 'DELETE')
  },
} as const

export default domainsService
