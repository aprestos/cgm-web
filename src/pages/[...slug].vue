<template>
  <NotFoundContent />
</template>

<script setup lang="ts">
import { RouteNames } from '@/router/routeNames'
import NotFoundContent from '@/components/NotFoundContent.vue'
import { useSeo } from '@/composables/useSeo'

definePageMeta({
  name: RouteNames.error.notFound,
})

/**
 * The status has to be set here rather than on the route, because this is the
 * only place that knows the page is being rendered. A page that says "not
 * found" in a 200 response is a soft 404: the crawler is told the URL is fine
 * and indexes the apology.
 */
const event = useRequestEvent()
if (event) setResponseStatus(event, 404)

// English, like the rest of this page. Translating it is a separate job.
useSeo({ title: 'Page not found', noindex: true })
</script>
