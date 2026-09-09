import { authService } from '@/features/auth/service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger'

/**
 * The two questions the route middleware in `src/middleware/` asks.
 *
 * They used to be wired into the route table as `meta.requiresAuth`, a
 * `meta.guard` function and a `beforeEnter`, read by a `navigationGuard` this
 * file exported. File-based routing has no route table to hang a function on —
 * `definePageMeta` is extracted at build time — so the wiring is named
 * middleware now and these are just the checks.
 */

// Authentication check guard
export const requiresAuth = async (): Promise<boolean> => {
  const tenantId = useTenantStore().tenant?.id
  if (!tenantId) return false

  try {
    const user = await authService.getUser(tenantId)
    return !!user
  } catch (error) {
    logger.error('Error on guards.requiresAuth()', { error })
    return false
  }
}

// Staff permission check guard
export const hasAnyOfRoles = async (roles: string[]): Promise<boolean> => {
  if (!roles || roles.length === 0) return false

  const tenantId = useTenantStore().tenant?.id
  if (!tenantId) return false

  try {
    const user = await authService.getUser(tenantId)
    if (!user?.access?.role) return false
    if (user.access.role === 'super-admin') return true
    return roles.includes(user.access.role)
  } catch (error) {
    logger.error('Error checking staff permissions:', { error })
    return false
  }
}
