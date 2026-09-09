<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

import { useFavicon } from '@vueuse/core'

import DomainNotConfigured from '@/views/DomainNotConfigured.vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useSeo } from '@/composables/useSeo'

const tenantStore = useTenantStore()

// Browser-only: it rewrites the <link rel="icon"> the document already has,
// which on a server there is no point in doing — the tenant's own icon is a
// post-hydration nicety, not something a crawler reads.
if (import.meta.client && tenantStore.tenant?.logo) {
  useFavicon().value = tenantStore.tenant.logo
}

/**
 * The head every page starts from: the site's name as the title and the `og:`
 * tags a shared link needs. A view that has something more specific to say
 * calls `useSeo` again and wins, since its setup runs after this one — and it
 * is the view, not this, that says whether the page has a canonical worth
 * naming.
 *
 * A host that resolves to no tenant is told not to index itself. It already
 * answers 404 or 503, but the two say different things and only one of them is
 * about the page's content.
 */
useSeo({
  canonical: false,
  noindex: () => !!tenantStore.unconfiguredDomain,
})
</script>

<template>
  <!--
    A host that resolves to no tenant gets this instead of the app, and
    nothing else: no router, no settings, no branding, because there is no
    tenant to take them from. `plugins/tenant.ts` has already answered 404 or
    503, so this is only the body of that response.
  -->
  <DomainNotConfigured
    v-if="tenantStore.unconfiguredDomain"
    :hostname="tenantStore.unconfiguredDomain.hostname"
    :status="tenantStore.unconfiguredDomain.status"
  />

  <template v-else>
    <Toaster rich-colors theme="system" position="top-center" />
    <NuxtPage />
  </template>
</template>

<style scoped></style>
