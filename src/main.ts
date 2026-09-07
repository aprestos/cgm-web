import './assets/main.css'
import './assets/fonts/inter/inter.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueCountdown from '@chenfengyuan/vue-countdown'

import { editionService } from '@/features/events/service.ts'
import tenantService from '@/features/tenant/service'
import type { Tenant } from '@/features/tenant/tenant.model.ts'
import { useEditionStore } from '@/features/events/edition.store'
import { useTenantStore } from '@/features/tenant/tenant.store'
import App from './App.vue'
import router from './router'
import { createHead } from '@unhead/vue/client'
import { useSettingsStore } from '@/features/settings/useSettings.store'
import { settingsService } from '@/features/settings/service.ts'
import type { Edition } from '@/features/events/edition.model.ts'
import i18n from '@/i18n'
import domainsService from '@/features/domains/service'
import DomainNotConfigured from '@/views/DomainNotConfigured.vue'
import logger from '@/lib/logger.ts'
import { migrateLegacySession } from '@/lib/supabase.ts'

// Always resolve from the hostname. The tenant a host maps to is server-side
// state that can change, so it is never read from a client-side cache.
async function loadTenant(): Promise<Tenant> {
  const tenant = await tenantService.getByDomain(window.location.hostname)
  useTenantStore().tenant = tenant
  return tenant
}

/**
 * Shown instead of the app when the hostname resolves to no tenant.
 *
 * Nothing here depends on a tenant, because there is not one: no router, no
 * settings, no branding. The status lookup only decides which of two things
 * to say, so a failure to read it still leaves a page rather than a blank
 * screen.
 */
async function mountUnconfiguredDomain(hostname: string): Promise<void> {
  const status = await domainsService
    .getStatusByHostname(hostname)
    .catch(() => null)

  createApp(DomainNotConfigured, { hostname, status }).mount('#app')
}

async function loadEdition(tenantId: string): Promise<Edition | null> {
  if (tenantId) {
    const editionStore = useEditionStore()
    editionStore.edition = await editionService.getCurrentEdition(tenantId)
    return editionStore.edition
  }
  return null
}

async function loadSettings(
  tenantId: string,
  editionId: number,
): Promise<void> {
  if (tenantId && editionId) {
    useSettingsStore().settings = await settingsService.get(tenantId, editionId)
  }
}

// Initialize app
async function initializeApp(): Promise<void> {
  const app = createApp(App)

  // Pinia goes on first: tenant, edition and settings are Pinia stores now,
  // and the loads below write straight into them.
  app.use(createPinia())

  // Before the router, so the first navigation's guards see a session that is
  // still in localStorage from before sessions moved to cookies.
  await migrateLegacySession()

  // Load tenant first before setting up router
  let tenant: Tenant
  try {
    tenant = await loadTenant()
  } catch (error) {
    // Only the tenant lookup is caught here. Letting the whole startup fall
    // back would report a network blip or a broken build as a domain that is
    // not configured, which sends the reader after the wrong problem.
    logger.error('No tenant serves this hostname', {
      hostname: window.location.hostname,
      error,
    })
    await mountUnconfiguredDomain(window.location.hostname)
    return
  }

  const edition = await loadEdition(tenant.id)
  if (edition) {
    await loadSettings(tenant.id, edition.id)
  }

  app.use(router)
  app.use(i18n)
  app.component(VueCountdown.name as string, VueCountdown)

  const head = createHead()
  app.use(head)

  app.mount('#app')
}

// Start the app
initializeApp().catch(console.error)
