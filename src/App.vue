<script setup lang="ts">
import { RouterView } from 'vue-router'

import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

import { useHead } from '@unhead/vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useFavicon } from '@vueuse/core'
import { useEditionStore } from '@/features/events/edition.store'
import { ref } from 'vue'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

if (tenantStore.tenant?.logo) {
  const icon = useFavicon()
  icon.value = tenantStore.tenant?.logo
}

const editionName = ref<string>(editionStore.edition?.name ?? 'congrem')

useHead({
  title: editionName,
})
</script>

<template>
  <Toaster rich-colors theme="system" position="top-center" />
  <RouterView />
</template>

<style scoped></style>
