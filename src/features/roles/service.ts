import type { AppRole, UserRole } from './role.model.ts'
import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'

const SELECT =
  'user_id, tenant_id, role, created_at, user:profiles(id, name, email)'

export const roleService = {
  /** List every user that has a role assigned in the given tenant. */
  async getAll(tenantId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(SELECT)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error on roleService.getAll()', { tenantId, error })
      throw new Error('Unable to load user roles')
    }

    return (data ?? []).map((row) => toCamelCaseAs<UserRole>(row))
  },

  /** Assign (or reassign) a role to a user within a tenant. */
  async assign(
    tenantId: string,
    userId: string,
    role: AppRole,
  ): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert(
        { tenant_id: tenantId, user_id: userId, role },
        { onConflict: 'user_id,tenant_id' },
      )
      .select(SELECT)
      .single()

    if (error) {
      logger.error('Error on roleService.assign()', {
        tenantId,
        userId,
        role,
        error,
      })
      throw new Error('Unable to assign role')
    }

    return toCamelCaseAs<UserRole>(data)
  },

  /** Update the role of an existing user in a tenant. */
  async updateRole(
    tenantId: string,
    userId: string,
    role: AppRole,
  ): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select(SELECT)
      .single()

    if (error) {
      logger.error('Error on roleService.updateRole()', {
        tenantId,
        userId,
        role,
        error,
      })
      throw new Error('Unable to update role')
    }

    return toCamelCaseAs<UserRole>(data)
  },

  /** Remove a user's role assignment from a tenant. */
  async remove(tenantId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)

    if (error) {
      logger.error('Error on roleService.remove()', { tenantId, userId, error })
      throw new Error('Unable to remove role')
    }
  },
}

export default roleService
