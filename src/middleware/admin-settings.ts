import { hasAnyOfRoles } from '@/router/guards'

/**
 * Settings are for admins, not for staff.
 *
 * This was a `beforeEnter` on the settings route, which cancelled the
 * navigation by answering false. It says the same thing the `/admin`
 * middleware says to somebody without the role, and for the same reason: a
 * page you may not open is a page that, to you, is not there.
 *
 * Runs alongside `admin`, not instead of it — Nuxt gathers middleware from
 * every matched record, so `/admin/settings` gets both.
 */
export default defineNuxtRouteMiddleware(async () => {
  if (!(await hasAnyOfRoles(['admin']))) {
    return abortNavigation(
      createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true }),
    )
  }
})
