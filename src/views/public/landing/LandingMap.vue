<script setup lang="ts">
import {
  IconMapPin,
  IconCalendar,
  IconClock,
  IconArrowRight,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

interface Props {
  locationTitle: string
  locationUrl?: string
  startDate?: string
  endDate?: string
  mapEmbedUrl: string | null
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
  <section id="map" class="relative overflow-hidden py-32">
    <div class="absolute inset-0 bg-gray-100 dark:bg-gray-950" />

    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <!-- Section Header -->
      <div class="text-center">
        <h2
          class="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400"
        >
          {{ t('landing.map.sectionTitle') }}
        </h2>
        <p
          class="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
        >
          {{ t('landing.map.sectionSubtitle') }}
        </p>
      </div>

      <!-- Location Card -->
      <div
        class="mt-12 overflow-hidden rounded-3xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-white/10 shadow-xl dark:shadow-none"
      >
        <div class="grid lg:grid-cols-2">
          <!-- Info -->
          <div class="flex flex-col justify-center p-8 lg:p-12">
            <div
              class="inline-flex rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 p-4 self-start"
            >
              <IconMapPin
                class="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <h3
              class="mt-6 text-2xl font-semibold text-gray-900 dark:text-white"
            >
              {{ locationTitle }}
            </h3>

            <div class="mt-6 space-y-4 text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-3">
                <IconCalendar
                  class="h-5 w-5 text-gray-400 dark:text-gray-500"
                />
                <span>{{ formatDate(startDate) }}</span>
              </div>
              <div v-if="endDate" class="flex items-center gap-3">
                <IconClock class="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span>{{
                  t('landing.map.until', { date: formatDate(endDate) })
                }}</span>
              </div>
            </div>

            <a
              v-if="locationUrl"
              :href="locationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/10 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-white/20"
            >
              <IconMapPin class="h-4 w-4" />
              {{ t('landing.map.getDirections') }}
              <IconArrowRight class="h-4 w-4" />
            </a>
          </div>

          <!-- Map -->
          <div class="aspect-square lg:aspect-auto">
            <iframe
              v-if="mapEmbedUrl"
              :src="mapEmbedUrl"
              width="100%"
              height="100%"
              style="border: 0; min-height: 400px"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="grayscale dark:grayscale"
            />
            <div
              v-else
              class="flex h-full min-h-[400px] items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              <IconMapPin class="h-16 w-16 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
