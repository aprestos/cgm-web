<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

import { useFavicon } from '@vueuse/core'
import { ref } from 'vue'

import DomainNotConfigured from '@/views/DomainNotConfigured.vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

// Browser-only: it rewrites the <link rel="icon"> the document already has,
// which on a server there is no point in doing — the tenant's own icon is a
// post-hydration nicety, not something a crawler reads.
if (import.meta.client && tenantStore.tenant?.logo) {
  useFavicon().value = tenantStore.tenant.logo
}

const editionName = ref<string>(editionStore.edition?.name ?? 'congrem')

useHead({
  title: editionName,
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
