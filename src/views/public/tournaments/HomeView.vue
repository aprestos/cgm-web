<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import TournamentToolbar from './TournamentToolbar.vue'
import TournamentStatusTabs from './TournamentStatusTabs.vue'
import TournamentGrid from './TournamentGrid.vue'
import TournamentGridSkeleton from './TournamentGridSkeleton.vue'
import DialogTournamentDetails from './dialogs/details/DialogTournamentDetails.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import FilterRadioGroup from '@/components/FilterRadioGroup.vue'
import {
  countByStatus,
  filterTournaments,
  SortOption,
  sortTournaments,
  STATUS_TABS,
  type StatusTab,
} from './tournaments.filters.ts'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import { authService } from '@/features/auth/service.ts'
import type { User } from '@/features/auth/user.model.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import type {
  CreateTournamentParticipant,
  TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import tournamentParticipantsService from '@/features/tournaments/participants/service.ts'
import tournamentService from '@/features/tournaments/events/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t } = useI18n()

const tournaments = ref<Tournament[]>([])
const participants = ref<Map<string, TournamentParticipant[]>>(new Map())
const loading = ref<boolean>(true)
const currentUser = ref<User | null>(null)
const selectedTournament = ref<Tournament | null>(null)
// Opened from a join/edit button rather than the card body, so the dialog
// scrolls past the info straight to the form.
const shownDialog = ref<string>('')
const searchQuery = ref<string>('')
const selectedStatus = ref<StatusTab>('all')
const selectedSort = ref<SortOption>(SortOption.soonest)
const filtersOpen = ref<boolean>(false)

const availableTournaments = computed<Tournament[]>(() =>
  tournaments.value.filter(
    (tournament) => tournament.status !== TournamentStatus.cancelled,
  ),
)

const statusCounts = computed(() => countByStatus(availableTournaments.value))

const sortOptions = computed(() =>
  Object.values(SortOption).map((option) => ({
    value: option,
    label: t(`public.tournaments.sort.${option}`),
  })),
)

// The counts come along so the panel says how much each status would leave.
const statusOptions = computed(() =>
  STATUS_TABS.map((status) => ({
    value: status,
    label: t(`public.tournaments.tabs.${status}`),
    count: statusCounts.value[status],
  })),
)

// Sort always has a value, so only a narrowed status counts as "active".
const activeFilterCount = computed<number>(() =>
  selectedStatus.value === 'all' ? 0 : 1,
)

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

const openDetails = (tournament: Tournament): void => {
  selectedTournament.value = tournament
  shownDialog.value = 'details'
}

const selectedParticipants = computed<TournamentParticipant[]>(() =>
  selectedTournament.value
    ? (participants.value.get(selectedTournament.value.id) ?? [])
    : [],
)

const closeDetailsDialog = (): void => {
  shownDialog.value = ''
}

const handleJoinConfirm = async (
  participants: CreateTournamentParticipant[],
): Promise<void> => {
  const tournament = selectedTournament.value
  if (
    !tenantStore.tenant ||
    !editionStore.edition ||
    !tournament ||
    !participants
  )
    return

  try {
    await tournamentParticipantsService.create(
      tenantStore.tenant.id,
      editionStore.edition.id,
      tournament.id,
      participants,
    )
  } catch {
    toast.error(t('public.tournaments.joinError'))
    return
  }
  toast.success(
    participants.length > 1
      ? t('public.tournaments.joinSuccessMultiple')
      : t('public.tournaments.joinSuccess'),
  )

  void loadTournaments()

  closeDetailsDialog()
}

async function loadTournaments(): Promise<void> {
  if (!tenantStore.tenant || !editionStore.edition) {
    loading.value = false
    return
  }

  try {
    const [allTournaments, tournamentParticipants] = await Promise.allSettled([
      tournamentService.getAll(tenantStore.tenant.id, editionStore.edition.id),
      tournamentParticipantsService.getAllByUser(
        tenantStore.tenant.id,
        editionStore.edition.id,
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
      :sort-options="sortOptions"
      :active-filter-count="activeFilterCount"
      @open-filters="filtersOpen = true"
    />

    <TournamentStatusTabs v-model="selectedStatus" :counts="statusCounts" />

    <!-- Narrow screens have no room for the sort control in the toolbar, so
         the panel carries it, plus the status list so every control on the
         page can be reached from one place -->
    <FilterSidebar
      v-model:open="filtersOpen"
      :title="t('public.tournaments.filters.title')"
    >
      <FilterRadioGroup
        v-model="selectedSort"
        :label="t('public.tournaments.sort.sortBy')"
        :options="sortOptions"
      />

      <div class="border-t border-gray-200 dark:border-gray-700">
        <FilterRadioGroup
          v-model="selectedStatus"
          :label="t('public.tournaments.filters.status')"
          :options="statusOptions"
        />
      </div>
    </FilterSidebar>

    <TournamentGridSkeleton v-if="loading" />

    <TournamentGrid
      v-else
      :tournaments="visibleTournaments"
      :participants="participants"
      :can-join="isAuthenticated"
      @details="openDetails"
      @join="openDetails"
      @edit="openDetails"
    />

    <DialogTournamentDetails
      :open="shownDialog === 'details'"
      :tournament="selectedTournament"
      :participants="selectedParticipants"
      :user="currentUser"
      :can-join="isAuthenticated"
      :focus-sign-up="false"
      @close="closeDetailsDialog"
      @confirm="handleJoinConfirm"
    />
  </div>
</template>

<style scoped></style>
