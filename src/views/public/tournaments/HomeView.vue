<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import TournamentToolbar from './TournamentToolbar.vue'
import TournamentStatusTabs from './TournamentStatusTabs.vue'
import TournamentGrid from './TournamentGrid.vue'
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
import logger from '@/lib/logger.ts'
import { useSeo } from '@/composables/useSeo'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t } = useI18n()

const participants = ref<Map<string, TournamentParticipant[]>>(new Map())
const currentUser = ref<User | null>(null)
const selectedTournament = ref<Tournament | null>(null)
// Opened from a join/edit button rather than the card body, so the dialog
// scrolls past the info straight to the form.
const shownDialog = ref<string>('')
const searchQuery = ref<string>('')
const selectedStatus = ref<StatusTab>('all')
const selectedSort = ref<SortOption>(SortOption.soonest)
const filtersOpen = ref<boolean>(false)

// Everything below reads `tournaments`, and one of the readers is a head
// computed, which unhead may resolve while this component's top-level `await`
// is still suspended. A `const` declared after that await is in its temporal
// dead zone until then, so the fetch and the ref it fills come first.

/**
 * The tournaments themselves, which are the same for every visitor.
 *
 * Public data, so it is fetched during the render rather than after it: this
 * page used to reach a crawler with its toolbar, its empty tab counts and no
 * tournaments at all. Step 5b of `docs/ssr-migration.md`.
 *
 * The throw is caught rather than left to `useAsyncData`, because on a server
 * it is not a failed fetch but a 500 for a page that can render its empty
 * state perfectly well. The toast only happens where there is somebody to
 * read it.
 */
async function fetchTournaments(): Promise<Tournament[]> {
  const tenantId = tenantStore.tenant?.id
  const editionId = editionStore.edition?.id
  if (!tenantId || !editionId) return []

  try {
    return await tournamentService.getAll(tenantId, editionId)
  } catch (error) {
    logger.error('Unable to load tournaments', { tenantId, editionId, error })
    if (import.meta.client) toast.error(t('public.tournaments.loadError'))
    return []
  }
}

const { data: renderedTournaments } = await useAsyncData(
  'public-tournaments',
  fetchTournaments,
  { default: (): Tournament[] => [] },
)

/**
 * Seeded from the render, then kept up to date in place.
 *
 * `useAsyncData`'s own `refresh()` would do the reload after a join too, but
 * it moves the request back to `pending`, and this page swapped the whole grid
 * for a skeleton while that was true. Reloading into the ref leaves the
 * tournaments on screen, which is what happened before the page was rendered
 * on a server.
 */
const tournaments = ref<Tournament[]>(renderedTournaments.value ?? [])

async function reloadTournaments(): Promise<void> {
  tournaments.value = await fetchTournaments()
}

/**
 * Which of these tournaments *this* visitor has signed up for.
 *
 * The one part of the page that is personal, so it stays in the browser: a
 * server render here is anonymous by design (see `src/lib/supabase.ts`), and a
 * public page that varies per visitor is one that cannot be cached — which is
 * what step 5a wants to do to it.
 */
async function loadParticipants(): Promise<void> {
  const tenantId = tenantStore.tenant?.id
  const editionId = editionStore.edition?.id

  if (!tenantId || !editionId || !currentUser.value) {
    participants.value = new Map()
    return
  }

  try {
    const rows = await tournamentParticipantsService.getAllByUser(
      tenantId,
      editionId,
      currentUser.value.id,
    )

    participants.value = rows.reduce(
      (acc: Map<string, TournamentParticipant[]>, participant) => {
        const currentTournament = acc.get(participant.tournamentId) ?? []
        currentTournament.push(participant)
        acc.set(participant.tournamentId, currentTournament)
        return acc
      },
      new Map(),
    )
  } catch (error) {
    logger.error("Unable to load the visitor's participations", { error })
    participants.value = new Map()
  }
}

const availableTournaments = computed<Tournament[]>(() =>
  tournaments.value.filter(
    (tournament) => tournament.status !== TournamentStatus.cancelled,
  ),
)

const statusCounts = computed(() => countByStatus(availableTournaments.value))

useSeo({
  title: () => t('public.tournaments.title'),
  description: () => {
    const name = editionStore.edition?.name ?? tenantStore.tenant?.name ?? ''
    const count = availableTournaments.value.length

    return count > 0
      ? t('public.tournaments.seo.withCount', { count, name })
      : t('public.tournaments.seo.description', { name })
  },
})

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

  void reloadTournaments()
  void loadParticipants()

  closeDetailsDialog()
}

onMounted(async () => {
  const tenantId = tenantStore.tenant?.id
  currentUser.value = tenantId ? await authService.getUser(tenantId) : null
  await loadParticipants()
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

    <!-- No skeleton: the grid is in the server's HTML, and a client-side
         navigation into this page waits for the same fetch before it swaps -->
    <TournamentGrid
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
