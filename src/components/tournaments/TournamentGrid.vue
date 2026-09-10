<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconTrophy } from '@tabler/icons-vue'
import TournamentCard from './TournamentCard.vue'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import type { TournamentParticipant } from '@/features/tournaments/participant.model.ts'

withDefaults(
  defineProps<{
    tournaments: Tournament[]
    participants: Map<string, TournamentParticipant[]>
    canJoin?: boolean
  }>(),
  {
    canJoin: false,
  },
)

const emit = defineEmits<{
  details: [tournament: Tournament]
  join: [tournament: Tournament]
  edit: [tournament: Tournament]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="tournaments.length"
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 lg:gap-x-6 xl:grid-cols-4"
  >
    <TournamentCard
      v-for="tournament in tournaments"
      :key="tournament.id"
      :tournament="tournament"
      :participants="participants.get(tournament.id) || []"
      :can-join="canJoin"
      @details="emit('details', $event)"
      @join="emit('join', $event)"
      @edit="emit('edit', $event)"
    />
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-4 py-16 text-center dark:border-white/10"
  >
    <div
      class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20"
    >
      <IconTrophy class="size-6 text-primary-600 dark:text-primary-400" />
    </div>
    <h3 class="font-display font-semibold text-gray-900 dark:text-white">
      {{ t('public.tournaments.empty') }}
    </h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ t('public.tournaments.emptyDescription') }}
    </p>
  </div>
</template>

<style scoped></style>
