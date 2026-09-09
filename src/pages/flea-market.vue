<script setup lang="ts">
import { RouteNames } from '@/router/routeNames'
import { useSeo } from '@/composables/useSeo'

definePageMeta({
  layout: 'public',
  name: RouteNames.public.fleaMarket,
})

// The page has no content yet. Until it does, it is a real URL that says
// nothing, which is the one kind of page worth keeping out of an index — and
// it is left out of `sitemap.xml` for the same reason.
useSeo({ noindex: true })
</script>

<template>
  <div></div>
</template>

<style scoped></style>
