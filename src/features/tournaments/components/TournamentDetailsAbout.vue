<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CreateTournament } from '../tournament.model.ts'

interface Props {
  /** Widened past `Tournament` so a draft can be previewed before it exists. */
  tournament: CreateTournament
  /** Drops the heading and the divider for a caller that frames it itself. */
  bare?: boolean
}

const props = withDefaults(defineProps<Props>(), { bare: false })

const { t } = useI18n()

// Optional, and blank once trimmed is the same as absent.
const description = computed<string>(
  () => props.tournament.description?.trim() ?? '',
)
</script>

<template>
  <section
    v-if="description"
    :class="bare ? '' : 'border-t border-gray-100 pt-5 dark:border-white/10'"
  >
    <h4
      v-if="!bare"
      class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    >
      {{ t('public.tournaments.details.about') }}
    </h4>
    <p
      class="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300"
      :class="bare ? '' : 'mt-2'"
    >
      {{ description }}
    </p>
  </section>
</template>
