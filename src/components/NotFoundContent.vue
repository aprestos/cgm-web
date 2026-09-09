<template>
  <main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
    <div class="text-center">
      <p class="text-base font-semibold text-primary-600 dark:text-primary-400">
        404
      </p>
      <h1
        class="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-white sm:text-7xl"
      >
        Page not found
      </h1>
      <p
        class="mt-6 text-lg font-medium text-pretty text-gray-500 dark:text-gray-400 sm:text-xl/8"
      >
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <NuxtLink
          to="/"
          class="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400"
        >
          Go back home
        </NuxtLink>
        <button
          class="text-sm font-semibold text-gray-900 dark:text-gray-100"
          @click="router.back()"
        >
          Go back
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

/**
 * The not-found page's markup, shared by the two places that show it.
 *
 * `pages/[...slug].vue` is the URL nobody claims; `error.vue` is the page Nuxt
 * shows when something throws one — including the admin middleware turning
 * away somebody who is signed in but not allowed. Both mean the same thing to
 * a visitor, so they say it the same way.
 */
const router = useRouter()
</script>
