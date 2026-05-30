import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'
import { authService } from '@/features/auth/service.ts'
import { RouteNames } from '@/router/routeNames'
import logger from '@/lib/logger'

// Guard function type
export type RouteGuard = () => Promise<boolean>

// Authentication check guard
export const requiresAuth = async (): Promise<boolean> => {
  try {
    const user = await authService.getUser()
    return !!user
  } catch (error) {
    logger.error('Error on guards.requiresAuth()', { error })
    return false
  }
}

// Staff permission check guard
export const hasAnyOfRoles = async (roles: string[]): Promise<boolean> => {
  if (!roles || roles.length === 0) return false
  try {
    const user = await authService.getUser()
    if (!user?.access?.role) return false
    if (user.access.role === 'super-admin') return true
    return roles.includes(user.access.role)
  } catch (error) {
    logger.error('Error checking staff permissions:', { error })
    return false
  }
}

// Main navigation guard handler (Vue 2 style)
export const navigationGuard = async (
  to: RouteLocationNormalized,
): Promise<NavigationGuardReturn> => {
  try {
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

    // Check authentication requirement
    if (to.meta.requiresAuth) {
      const isAuthenticated = await requiresAuth()

      if (isAuthenticated) {
        return
      } else {
        return { name: RouteNames.auth.signIn }
      }
    }

    // No guards required, proceed
    return
  } catch (error) {
    console.error('Navigation guard error:', error)
    return { name: RouteNames.error.notFound }
  }
}
