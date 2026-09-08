import { navigationGuard } from '@/router/guards'

/**
 * The old `router.beforeEach(navigationGuard)`, as Nuxt middleware.
 *
 * Nuxt creates the router itself, so there is no instance left to hang a
 * `beforeEach` on. Global middleware is the same hook by another name: it runs
 * before every navigation, in file-name order, after all plugins — which is
 * what the guard needs, since it reads the tenant that `plugins/tenant.ts`
 * resolves.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const redirect = await navigationGuard(to)
  if (redirect) return navigateTo(redirect)
})
