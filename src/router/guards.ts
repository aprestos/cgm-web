import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { authService } from '@/features/auth/service.ts'
import { RouteNames } from '@/router/routeNames'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger'

// Guard function type
export type RouteGuard = () => Promise<boolean>

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

/**
 * Where a navigation should go instead, or undefined to let it through.
 *
 * Installed as Nuxt global middleware (`src/middleware/auth.global.ts`)
 * rather than `router.beforeEach`, because Nuxt owns the router instance now.
 * The logic is unchanged.
 *
 * This also runs on the server, where there is no session to read, so a
 * guarded route would redirect to sign-in rather than render. That is the safe
 * direction, and it does not come up today: every guarded route is under
 * `/admin` or `/auth`, which `routeRules` keeps client-rendered.
 */
export const navigationGuard = async (
  to: RouteLocationNormalized,
): Promise<RouteLocationRaw | undefined> => {
  try {
    // Routes with a custom guard or requiresAuth need a logged-in user first
    if (to.meta.guard || to.meta.requiresAuth) {
      const isAuthenticated = await requiresAuth()

      if (!isAuthenticated) {
        return {
          name: RouteNames.auth.signIn,
          query: { redirect: to.fullPath },
        }
      }
    }

    // Check custom guard function
    if (to.meta.guard) {
      logger.debug('calling guard', to.meta)
      const hasPermission = await to.meta.guard()
      logger.debug('hasPermission', { hasPermission })

      if (hasPermission) {
        return
      } else {
        return { name: RouteNames.error.notFound }
      }
    }

    // No guards required, proceed
    return
  } catch (error) {
    console.error('Navigation guard error:', error)
    return { name: RouteNames.error.notFound }
  }
}
