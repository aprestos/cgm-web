import type { H3Event } from 'h3'

import { editionService } from '@/features/events/service.ts'
import tenantService from '@/features/tenant/service'
import domainsService from '@/features/domains/service'
import { settingsService } from '@/features/settings/service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import { useSettingsStore } from '@/features/settings/useSettings.store'
import logger from '@/lib/logger.ts'

/**
 * Resolves the tenant, its current edition and its settings before anything
 * renders.
 *
 * This is the point of the whole SSR migration. The old `src/main.ts` could
 * only ask the *browser* which host it was on, so the sequence was: blank
 * page, ask for the tenant, ask for the edition, ask for the settings, then
 * mount. Three round trips before first paint, the first of which existed only
 * to tell the server something it already knew.
 *
 * A server was handed the `Host` header with the request. Reading it costs
 * nothing, and the two lookups that follow happen while the page is being
 * rendered rather than before it starts. The result rides to the browser in
 * the Pinia payload, so the client repeats none of it.
 *
 * Runs as a plugin rather than middleware because every route needs it and
 * route middleware runs after plugins — the auth guard in
 * `middleware/auth.global.ts` reads the tenant this resolves.
 */
export default defineNuxtPlugin({
  name: 'tenant',
  // `useTenantStore()` needs an active Pinia, and on the client the payload
  // has to be back in the stores before the check below can see it.
  dependsOn: ['pinia'],

  async setup(nuxtApp) {
    // Everything this plugin needs from the request is taken now, before the
    // first `await`.
    //
    // Pinia's "active instance" and Nuxt's "current request" are both module
    // globals. A server handling two requests at once swaps them at every
    // suspension point, so a `useTenantStore()` or `useRequestEvent()` called
    // after an await can answer with the *other* visitor's request — a query
    // filtered by the wrong tenant, quiet and load-dependent. Capturing the
    // request's own Pinia and event up front, and passing them down, is the
    // same fix the services got in step 4c.
    const pinia = nuxtApp.$pinia
    const event = import.meta.server ? useRequestEvent() : undefined

    const tenantStore = useTenantStore(pinia)
    const editionStore = useEditionStore(pinia)
    const settingsStore = useSettingsStore(pinia)

    // A server-rendered page arrives with all of this already in the payload.
    if (tenantStore.tenant || tenantStore.unconfiguredDomain) return

    const hostname = currentHostname()

    try {
      // Always resolve from the hostname. The tenant a host maps to is
      // server-side state that can change, so it is never read from a cache.
      tenantStore.tenant = await tenantService.getByDomain(hostname)
    } catch (error) {
      // Only the tenant lookup is caught here. Letting the whole startup fall
      // back would report a network blip or a broken build as a domain that is
      // not configured, which sends the reader after the wrong problem.
      logger.error('No tenant serves this hostname', { hostname, error })
      await reportUnconfiguredDomain(hostname, tenantStore, event)
      return
    }

    const tenantId = tenantStore.tenant.id
    const edition = await editionService.getCurrentEdition(tenantId)
    editionStore.edition = edition

    if (edition) {
      settingsStore.settings = await settingsService.get(tenantId, edition.id)
    }
  },
})

/**
 * The host this render is for.
 *
 * Safe to read ambiently only because it is called before the plugin's first
 * `await`, while the current request is still the one Nuxt set up.
 *
 * The `Host` header carries the port (`localhost:3000`); `location.hostname`
 * never does, and the stored domains never do either, so it is stripped to
 * keep the two paths answering the same string.
 */
function currentHostname(): string {
  if (import.meta.client) return window.location.hostname

  const host = useRequestHeaders(['host']).host ?? ''
  return host.split(':')[0] ?? ''
}

/**
 * Records that the host belongs to no tenant, and says so in the status code.
 *
 * The status lookup only decides which of two things the page will say, so a
 * failure to read it still leaves a page rather than a blank screen.
 *
 * A crawler told 200 would index an error page under the domain, so a host
 * nobody has claimed answers 404. One that is registered but still verifying
 * answers 503: it is a real address whose DNS has not propagated, and 503 is
 * the code that means come back rather than forget this URL.
 */
async function reportUnconfiguredDomain(
  hostname: string,
  tenantStore: ReturnType<typeof useTenantStore>,
  event: H3Event | undefined,
): Promise<void> {
  const status = await domainsService
    .getStatusByHostname(hostname)
    .catch(() => null)

  tenantStore.unconfiguredDomain = { hostname, status }

  if (event) {
    const isPending = status === 'pending' || status === 'verifying'
    setResponseStatus(event, isPending ? 503 : 404)
  }
}
