<script setup lang="ts">
import {
  IconArrowRight,
  IconHeart,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandTwitter,
} from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/routeNames.js'
import { useI18n } from 'vue-i18n'
import { tenantStore } from '@/stores/tenant.ts'

const { t } = useI18n()
</script>

<template>
  <section class="relative overflow-hidden bg-gray-50 py-32 dark:bg-gray-950">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-linear-to-b from-gray-50 via-indigo-100/40 to-gray-50 dark:from-gray-950 dark:via-indigo-950/35 dark:to-gray-950"
    />
    <div
      class="absolute bottom-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-300/30 dark:bg-indigo-600/20 blur-3xl"
    />

    <div class="relative z-10 mx-auto max-w-4xl px-4 text-center">
      <div
        class="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-white/10 px-4 py-2 text-sm text-gray-700 dark:text-white/80"
      >
        <IconHeart class="h-4 w-4 text-red-500 dark:text-red-400" />
        {{ t('landing.cta.badge') }}
      </div>

      <h2
        class="mt-8 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
      >
        {{ t('landing.cta.title') }}<br />
        <span
          class="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent"
        >
          {{ t('landing.cta.titleHighlight') }}
        </span>
      </h2>

      <p class="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
        {{ t('landing.cta.description') }}
      </p>

      <div
        class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <RouterLink
          :to="{ name: RouteNames.auth.signIn }"
          class="group inline-flex items-center gap-3 rounded-full bg-gray-900 dark:bg-white px-8 py-4 text-lg font-semibold text-white dark:text-gray-900 shadow-lg transition-all duration-300 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-gray-900/25 dark:hover:shadow-white/25"
        >
          {{ t('landing.cta.button') }}
          <IconArrowRight
            class="h-5 w-5 transition-transform group-hover:translate-x-1"
          />
        </RouterLink>
      </div>

      <!-- Social Links -->
      <div class="mt-16 flex items-center justify-center gap-6">
        <a
          v-if="tenantStore?.socialNetworks?.instagram"
          target="_blank"
          :href="tenantStore.socialNetworks.instagram"
          class="text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
          aria-label="Instagram"
        >
          <IconBrandInstagram class="h-6 w-6" />
        </a>
        <a
          v-if="tenantStore?.socialNetworks?.facebook"
          target="_blank"
          :href="tenantStore?.socialNetworks?.facebook"
          class="text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
          aria-label="Facebook"
        >
          <IconBrandFacebook class="h-6 w-6" />
        </a>
        <a
          v-if="tenantStore?.socialNetworks?.x"
          target="_blank"
          :href="tenantStore?.socialNetworks?.x"
          class="text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
          aria-label="Twitter"
        >
          <IconBrandTwitter class="h-6 w-6" />
        </a>
      </div>
    </div>
  </section>
</template>
