import './assets/main.css'
import './index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueCountdown from '@chenfengyuan/vue-countdown'

import { editionService } from '@/features/events/service.ts'
import LocalStorageService from '@/features/localstorage/local-storage.service'
import tenantService from '@/features/tenant/service'
import type { Tenant } from '@/features/tenant/tenant.model.ts'
import { editionStore } from '@/stores/edition'
import { tenantStore } from '@/stores/tenant'
import App from './App.vue'
import router from './router'
import { createHead } from '@unhead/vue/client'
import { settingsStore } from '@/features/settings/useSettings.store.ts'
import { settingsService } from '@/features/settings/service.ts'
import type { Edition } from '@/features/events/event.model.ts'
import i18n from '@/i18n'

async function loadTenant(): Promise<Tenant | null> {
  const tenantId = LocalStorageService.getTenantId()
  let tenant: Tenant | null
  if (tenantId) {
    tenant = await tenantService.getById(tenantId)
  } else {
    const domain = window.location.hostname
    tenant = await tenantService.getByDomain(domain)
    LocalStorageService.setTenantId(tenant.id)
  }
  tenantStore.value = tenant
  return tenant
}

async function loadEdition(tenantId: string): Promise<Edition | null> {
  if (tenantId) {
    editionStore.value = await editionService.getCurrentEdition(tenantId)
    return editionStore?.value || null
  }
  return null
}

async function loadSettings(
  tenantId: string,
  editionId: number,
): Promise<void> {
  if (tenantId && editionId) {
    settingsStore.value = await settingsService.get(tenantId, editionId)
  }
}

// Initialize app
async function initializeApp(): Promise<void> {
  const app = createApp(App)

  // Load tenant first before setting up router
  const tenant = await loadTenant()
  if (tenant) {
    const edition = await loadEdition(tenant.id)
    if (edition) {
      await loadSettings(tenant.id, edition.id)
    }
  }

  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.component(VueCountdown.name as string, VueCountdown)

  const head = createHead()
  app.use(head)

  app.mount('#app')
}

// Start the app
initializeApp().catch(console.error)
