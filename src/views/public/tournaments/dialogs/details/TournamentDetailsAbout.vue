<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'

interface Props {
  tournament: Tournament
}

const props = defineProps<Props>()

const { t } = useI18n()

// Optional, and blank once trimmed is the same as absent.
const description = computed<string>(
  () => props.tournament.description?.trim() ?? '',
)
</script>

<template>
  <section
    v-if="description"
    class="border-t border-gray-100 pt-5 dark:border-white/10"
  >
    <h4
      class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    >
      {{ t('public.tournaments.details.about') }}
    </h4>
    <p
      class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300"
    >
      {{ description }}
    </p>
  </section>
</template>
