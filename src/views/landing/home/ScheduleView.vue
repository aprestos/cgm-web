<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Schedule } from '@/features/events/event.model.ts'

interface Props {
  images: Schedule
}

defineProps<Props>()

const { t } = useI18n()
</script>

<template>
  <section
    id="schedule"
    class="relative overflow-hidden bg-gray-50 py-12 dark:bg-gray-950 sm:py-16 lg:py-24"
  >
    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <div class="text-center">
        <h2
          class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 sm:text-sm"
        >
          {{ t('landing.schedule.sectionTitle') }}
        </h2>
        <p
          class="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:mt-4 sm:text-3xl lg:text-5xl"
        >
          {{ t('landing.schedule.sectionSubtitle') }}
        </p>
      </div>

      <div class="lg:hidden mt-8 grid gap-4 sm:mt-10 sm:gap-6 grid-cols-1">
        <article
          v-for="(imageUrl, index) in images?.smartphone || []"
          :key="`${imageUrl}-${index}`"
          class="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-white/10"
        >
          <img
            :src="imageUrl"
            :alt="t('landing.schedule.imageAlt', { index: index + 1 })"
            class="object-cover"
            loading="lazy"
          />
        </article>
      </div>
      <div class="hidden lg:grid mt-8 gap-4 sm:mt-10 sm:gap-6 grid-cols-1">
        <article
          v-for="(imageUrl, index) in images?.desktop || []"
          :key="`${imageUrl}-${index}`"
          class="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-white/10"
        >
          <img
            :src="imageUrl"
            :alt="t('landing.schedule.imageAlt', { index: index + 1 })"
            class="object-cover"
            loading="lazy"
          />
        </article>
      </div>
    </div>
  </section>
</template>
