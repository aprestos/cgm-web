import { hasAnyOfRoles, requiresAuth } from '@/router/guards'
import { RouteNames } from '@/router/routeNames'

/**
 * Who may see anything under `/admin`.
 *
 * This was `meta.requiresAuth` plus a `meta.guard` function on the `/admin`
 * route record, read by a global `navigationGuard`. `definePageMeta` is
 * extracted at build time and cannot carry a function, and named middleware is
 * what Nuxt offers instead — so the check moved here and `pages/admin.vue`
 * names it. Nuxt collects middleware from every matched record, so declaring
 * it on the parent covers all of `/admin`.
 *
 * The two failures are different and answer differently. Nobody signed in is
 * sent to sign in, and told where they were going. Somebody signed in without
 * the role is told the page does not exist, because as far as they are
 * concerned it does not — `error.vue` renders the same not-found page an
 * unknown URL gets.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!(await requiresAuth())) {
    return navigateTo({
      name: RouteNames.auth.signIn,
      query: { redirect: to.fullPath },
    })
  }

  if (!(await hasAnyOfRoles(['admin', 'staff']))) {
    return abortNavigation(
      createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true }),
    )
  }
})
