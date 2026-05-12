<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

interface Props {
  countdown: { days: number; hours: number; minutes: number }
  startDate?: string
}

defineProps<Props>()

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'TBA'
  return new Date(dateString).toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <section
    id="countdown"
    class="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]"
    />

    <div class="relative z-10 mx-auto max-w-4xl px-4 text-center">
      <h2
        class="text-lg font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
      >
        {{ t('landing.countdown.title') }}
      </h2>

      <div class="mt-10 flex justify-center gap-4 sm:gap-8">
        <div
          class="flex flex-col items-center rounded-2xl bg-white dark:bg-white/5 px-6 py-8 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none backdrop-blur-sm sm:px-10"
        >
          <span
            class="text-5xl font-bold text-gray-900 dark:text-white sm:text-7xl"
            >{{ countdown.days }}</span
          >
          <span
            class="mt-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >{{ t('landing.countdown.days') }}</span
          >
        </div>
        <div
          class="flex flex-col items-center rounded-2xl bg-white dark:bg-white/5 px-6 py-8 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none backdrop-blur-sm sm:px-10"
        >
          <span
            class="text-5xl font-bold text-gray-900 dark:text-white sm:text-7xl"
            >{{ countdown.hours }}</span
          >
          <span
            class="mt-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >{{ t('landing.countdown.hours') }}</span
          >
        </div>
        <div
          class="flex flex-col items-center rounded-2xl bg-white dark:bg-white/5 px-6 py-8 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none backdrop-blur-sm sm:px-10"
        >
          <span
            class="text-5xl font-bold text-gray-900 dark:text-white sm:text-7xl"
            >{{ countdown.minutes }}</span
          >
          <span
            class="mt-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >{{ t('landing.countdown.minutes') }}</span
          >
        </div>
      </div>

      <p class="mt-8 text-lg text-gray-600 dark:text-gray-400">
        {{ formatDate(startDate) }}
      </p>
    </div>
  </section>
</template>
