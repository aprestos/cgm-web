<script setup lang="ts">
import { IconArrowRight } from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'

const { t } = useI18n()

interface Feature {
  id: string
  name: string
  description: string
  icon: Component
  route: string
  gradient: string
  available: boolean
}

interface Props {
  features: Feature[]
}

defineProps<Props>()
</script>

<template>
  <section id="features" class="relative py-32">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950"
    />

    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <!-- Section Header -->
      <div class="text-center">
        <h2
          class="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
        >
          {{ t('landing.features.sectionTitle') }}
        </h2>
        <p
          class="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
        >
          {{ t('landing.features.sectionSubtitle') }}
        </p>
        <p
          class="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
        >
          {{ t('landing.features.sectionDescription') }}
        </p>
      </div>

      <!-- Features Grid -->
      <div class="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="feature in features"
          :key="feature.id"
          :to="{ name: feature.route }"
          class="group relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 p-8 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none transition-all duration-500 hover:ring-indigo-300 dark:hover:ring-white/20 hover:shadow-xl dark:hover:shadow-none"
        >
          <!-- Gradient Background on Hover -->
          <div
            :class="[
              'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-5 dark:group-hover:opacity-10',
              feature.gradient,
            ]"
          />

          <!-- Icon -->
          <div
            :class="[
              'inline-flex rounded-2xl bg-gradient-to-br p-4',
              feature.gradient,
            ]"
          >
            <component :is="feature.icon" class="h-8 w-8 text-white" />
          </div>

          <!-- Content -->
          <h3 class="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
            {{ feature.name }}
          </h3>
          <p class="mt-3 text-gray-600 dark:text-gray-400">
            {{ feature.description }}
          </p>

          <!-- Arrow -->
          <div
            class="mt-6 flex items-center text-sm font-medium text-gray-500 dark:text-white/60 transition-colors group-hover:text-indigo-600 dark:group-hover:text-white"
          >
            {{ t('landing.features.explore') }}
            <IconArrowRight
              class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
