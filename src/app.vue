<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

import { useFavicon } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import DomainNotConfigured from '@/components/DomainNotConfigured.vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useSeo } from '@/composables/useSeo'
import { LogoType } from '~/features/tenant/tenant.model.ts'

const tenantStore = useTenantStore()

// Browser-only: it rewrites the href of every icon link the document already
// has — Congrem's, from `nuxt.config.ts` — which on a server there is no point
// in doing. The tenant's own icon is a post-hydration nicety, not something a
// crawler reads, and a tenant that uploaded none keeps the platform's.
const logo = tenantStore.getLogo(LogoType.square)
if (import.meta.client && logo) {
  useFavicon().value = logo
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

/**
 * The document's language, following the one the page is actually in.
 *
 * It was a static `en` in `nuxt.config.ts`, which in a SPA nobody could see:
 * the shell had no text in it. On a server-rendered page it is a claim about
 * content that is right there in the response, and it was wrong for every
 * Portuguese visitor. `plugins/i18n.ts` resolves the language per request now
 * (step 5e), which is what makes this possible at all.
 *
 * Reactive, so switching language in the page updates it too.
 */
const { locale } = useI18n()
useHead({ htmlAttrs: { lang: locale } })
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

    <!--
      `NuxtLayout` is what makes `definePageMeta({ layout })` mean anything.
      The landing and public pages each sit in their own chrome, which used to
      be two sibling route records both matching `''` — a shape a scanned
      `pages/` tree cannot express, and layouts are what Nuxt offers instead.
      Pages that name no layout (admin, auth, the 404) render bare, because
      there is no `layouts/default.vue` for them to fall into.
    -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </template>
</template>

<style scoped></style>
