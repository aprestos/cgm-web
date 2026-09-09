<template>
  <NotFoundContent v-if="props.error?.statusCode === 404" />

  <main v-else class="grid min-h-full place-items-center px-6 py-24 lg:px-8">
    <div class="text-center">
      <p class="text-base font-semibold text-primary-600 dark:text-primary-400">
        {{ props.error?.statusCode ?? 500 }}
      </p>
      <h1
        class="mt-4 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white"
      >
        Something went wrong
      </h1>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <button
          class="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400"
          @click="clearError({ redirect: '/' })"
        >
          Go back home
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import NotFoundContent from '@/components/NotFoundContent.vue'

/**
 * What Nuxt renders when something throws instead of returning a page.
 *
 * Without this file that is Nuxt's own error screen, which is a different
 * design and a different language from the rest of the app. A 404 gets the
 * same page an unknown URL gets, because to a visitor it is the same thing —
 * the admin middleware throws one at somebody who is signed in but not
 * allowed, and there is no reason for that to look unlike any other missing
 * page.
 */
const props = defineProps<{ error?: NuxtError }>()
</script>
