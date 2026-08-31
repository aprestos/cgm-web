<script setup lang="ts">
/**
 * The create form's live preview: the same layout players get, in one column
 * and without a roster, since there is nothing to sign up to yet.
 */
import { useI18n } from 'vue-i18n'
import TournamentDetailsLayout from '@/features/tournaments/components/TournamentDetailsLayout.vue'
import type { CreateTournament } from '@/features/tournaments/tournament.model.ts'

interface Props {
  /** The form as it stands, not something that reached the database yet. */
  tournament: CreateTournament
  /** Local object URL for the picked cover — it is only uploaded on submit. */
  cover?: string
}

withDefaults(defineProps<Props>(), { cover: undefined })

const { t } = useI18n()
</script>

<template>
  <div
    class="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/40 dark:ring-white/10"
  >
    <TournamentDetailsLayout
      :tournament="tournament"
      :cover="cover"
      :placeholder-title="t('admin.tournaments.preview.untitled')"
      dense
    />
  </div>
</template>
