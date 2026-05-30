<script setup lang="ts">
import { IconMapPin } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  locationTitle: string
  locationUrl?: string
  mapEmbedUrl: string | null
}

defineProps<Props>()
</script>

<template>
  <section
    id="location"
    class="relative overflow-hidden bg-gray-50 py-12 dark:bg-gray-950 sm:py-16 lg:py-28"
  >
    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <!-- Section Header -->
      <div class="text-center">
        <h2
          class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 sm:text-sm"
        >
          {{ t('landing.map.sectionTitle') }}
        </h2>
        <p
          class="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:mt-4 sm:text-3xl lg:text-5xl"
        >
          {{ t('landing.map.sectionSubtitle') }}
        </p>
      </div>

      <!-- Location Card -->
      <div
        class="mt-6 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-white/10 sm:mt-10 sm:rounded-3xl"
      >
        <div class="grid lg:grid-cols-1">
          <!-- Map -->
          <div class="min-h-[420px] sm:min-h-[520px] lg:min-h-[620px]">
            <iframe
              v-if="mapEmbedUrl"
              :src="mapEmbedUrl"
              :title="locationTitle"
              width="100%"
              height="100%"
              style="border: 0"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="grayscale dark:grayscale"
            />
            <div
              v-else
              class="flex h-full min-h-75 flex-col items-center justify-center gap-3 bg-gray-100 px-4 text-center dark:bg-gray-800"
            >
              <IconMapPin class="h-16 w-16 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ locationTitle }}
              </p>
              <a
                v-if="locationUrl"
                :href="locationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                {{ t('landing.map.getDirections') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
