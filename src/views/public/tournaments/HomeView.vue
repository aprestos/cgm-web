<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import TournamentToolbar from './TournamentToolbar.vue'
import TournamentStatusTabs from './TournamentStatusTabs.vue'
import TournamentGrid from './TournamentGrid.vue'
import TournamentGridSkeleton from './TournamentGridSkeleton.vue'
import DialogTournamentDetails from './dialogs/details/DialogTournamentDetails.vue'
import {
  countByStatus,
  filterTournaments,
  SortOption,
  sortTournaments,
  type StatusTab,
} from './tournaments.filters.ts'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import tournamentService from '@/features/tournaments/service.ts'
import { authService } from '@/features/auth/service.ts'
import type { User } from '@/features/auth/user.model.ts'
import { tenantStore } from '@/features/tenant/tenant.store.ts'
import { editionStore } from '@/features/events/edition.store.ts'
import type {
  CreateTournamentParticipant,
  TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'

const { t } = useI18n()

const tournaments = ref<Tournament[]>([])
const participants = ref<Map<string, TournamentParticipant[]>>(new Map())
const loading = ref<boolean>(true)
const currentUser = ref<User | null>(null)
const selectedTournament = ref<Tournament | null>(null)
// Opened from a join/edit button rather than the card body, so the dialog
// scrolls past the info straight to the form.
const focusSignUp = ref<boolean>(false)
const searchQuery = ref<string>('')
const selectedStatus = ref<StatusTab>('all')
const selectedSort = ref<SortOption>(SortOption.soonest)

const availableTournaments = computed<Tournament[]>(() =>
  tournaments.value.filter(
    (tournament) => tournament.status !== TournamentStatus.cancelled,
  ),
)

const statusCounts = computed(() => countByStatus(availableTournaments.value))

const visibleTournaments = computed<Tournament[]>(() =>
  sortTournaments(
    filterTournaments(
      availableTournaments.value,
      selectedStatus.value,
      searchQuery.value,
    ),
    selectedSort.value,
  ),
)

// Only signed-in users get the join button, so the dialog always has a user.
const isAuthenticated = computed<boolean>(() => !!currentUser.value)

const openDetails = (tournament: Tournament, atSignUp: boolean): void => {
  selectedTournament.value = tournament
  focusSignUp.value = atSignUp
}

const selectedParticipants = computed<TournamentParticipant[]>(() =>
  selectedTournament.value
    ? (participants.value.get(selectedTournament.value.id) ?? [])
    : [],
)

const closeDetailsDialog = (): void => {
  focusSignUp.value = false
}

const handleJoinConfirm = async (
  participants: CreateTournamentParticipant[],
): Promise<void> => {
  const tournament = selectedTournament.value
  if (!tenantStore.value || !editionStore.value || !tournament || !participants)
    return

  try {
    await tournamentService.join(
      tenantStore.value.id,
      editionStore.value.id,
      tournament.id,
      participants,
    )
  } catch {
    toast.error(t('public.tournaments.joinError'))
    return
  }
  toast.success(
    participants.length > 1
      ? t('public.tournaments.joinSuccessMultiple', {
          title: tournament.title,
          count: participants.length,
        })
      : t('public.tournaments.joinSuccess', {
          title: tournament.title,
          name: participants[0]?.participantName ?? '',
        }),
  )

  void loadTournaments()

  closeDetailsDialog()
}

async function loadTournaments(): Promise<void> {
  if (!tenantStore.value || !editionStore.value) {
    loading.value = false
    return
  }

  try {
    const [allTournaments, tournamentParticipants] = await Promise.allSettled([
      tournamentService.getAll(tenantStore.value.id, editionStore.value.id),
      tournamentService.getParticipantsByUser(
        tenantStore.value.id,
        editionStore.value.id,
        currentUser.value?.id,
      ),
    ])

    if (allTournaments.status === 'fulfilled')
      tournaments.value = allTournaments.value
    if (tournamentParticipants.status === 'fulfilled')
      participants.value = tournamentParticipants.value.reduce(
        (acc: Map<string, TournamentParticipant[]>, participant) => {
          const currentTournament = acc.get(participant.tournamentId) ?? []
          currentTournament.push(participant)
          acc.set(participant.tournamentId, currentTournament)
          return acc
        },
        new Map(),
      )
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    toast.error(t('public.tournaments.loadError'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  currentUser.value = await authService.getUser()
  await loadTournaments()
})
</script>

<template>
  <div class="pb-16">
    <TournamentToolbar
      v-model:search="searchQuery"
      v-model:sort="selectedSort"
    />

    <TournamentStatusTabs v-model="selectedStatus" :counts="statusCounts" />

    <TournamentGridSkeleton v-if="loading" />

    <TournamentGrid
      v-else
      :tournaments="visibleTournaments"
      :participants="participants"
      :can-join="isAuthenticated"
      @details="openDetails($event, false)"
      @join="openDetails($event, true)"
      @edit="openDetails($event, true)"
    />

    <DialogTournamentDetails
      :open="focusSignUp"
      :tournament="selectedTournament"
      :participants="selectedParticipants"
      :user="currentUser"
      :can-join="isAuthenticated"
      :focus-sign-up="focusSignUp"
      @close="closeDetailsDialog"
      @confirm="handleJoinConfirm"
    />
  </div>
</template>

<style scoped></style>
