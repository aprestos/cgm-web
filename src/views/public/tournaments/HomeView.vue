<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { toast } from 'vue-sonner'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { IconArrowsSort, IconCheck, IconTrophy } from '@tabler/icons-vue'
import SearchInput from '@/components/SearchInput.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TournamentCard from './TournamentCard.vue'
import { type Tournament, TournamentStatus } from '@/features/tournaments/model'
import tournamentService from '@/features/tournaments/service.ts'
import { authService } from '@/features/auth/service.ts'
import { tenantStore } from '@/features/tenant/tenant.store.ts'
import { editionStore } from '@/features/events/edition.store.ts'

const { t } = useI18n()

enum SortOption {
  soonest = 'soonest',
  slots = 'slots',
  name = 'name',
}

// Cancelled tournaments are never shown, so the tabs cover the rest.
const STATUS_TABS = [
  'all',
  TournamentStatus.scheduled,
  TournamentStatus.ongoing,
  TournamentStatus.finished,
] as const

type StatusTab = (typeof STATUS_TABS)[number]

const tournaments = ref<Tournament[]>([])
const loading = ref<boolean>(true)
const isAuthenticated = ref<boolean>(false)
const searchQuery = ref<string>('')
const selectedStatus = ref<StatusTab>('all')
const selectedSort = ref<SortOption>(SortOption.soonest)

const availableTournaments = computed<Tournament[]>(() =>
  tournaments.value.filter(
    (tournament) => tournament.status !== TournamentStatus.cancelled,
  ),
)

const countByStatus = computed<Record<StatusTab, number>>(() => {
  const counts = {
    all: availableTournaments.value.length,
    [TournamentStatus.scheduled]: 0,
    [TournamentStatus.ongoing]: 0,
    [TournamentStatus.finished]: 0,
  } as Record<StatusTab, number>

  for (const tournament of availableTournaments.value) {
    if (tournament.status in counts) {
      counts[tournament.status as StatusTab]++
    }
  }

  return counts
})

const slotsLeft = (tournament: Tournament): number =>
  Math.max(tournament.maxParticipants - tournament.participants, 0)

const visibleTournaments = computed<Tournament[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const filtered = availableTournaments.value.filter((tournament) => {
    if (
      selectedStatus.value !== 'all' &&
      tournament.status !== selectedStatus.value
    ) {
      return false
    }

    if (!query) return true

    return (
      tournament.title.toLowerCase().includes(query) ||
      (tournament.organizer ?? '').toLowerCase().includes(query) ||
      (tournament.place ?? '').toLowerCase().includes(query)
    )
  })

  return filtered.sort((a, b) => {
    switch (selectedSort.value) {
      case SortOption.slots:
        return slotsLeft(b) - slotsLeft(a)
      case SortOption.name:
        return a.title.localeCompare(b.title)
      default:
        return (
          DateTime.fromISO(a.startsAt).toMillis() -
          DateTime.fromISO(b.startsAt).toMillis()
        )
    }
  })
})

// Sign-ups aren't persisted yet — the toast stands in for the real flow.
const handleJoin = (tournament: Tournament): void => {
  toast.success(
    t('public.tournaments.joinSuccess', { title: tournament.title }),
  )
}

async function loadTournaments(): Promise<void> {
  if (!tenantStore.value || !editionStore.value) {
    loading.value = false
    return
  }

  try {
    tournaments.value = await tournamentService.getAll(
      tenantStore.value.id,
      editionStore.value.id,
    )
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    toast.error(t('public.tournaments.loadError'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  isAuthenticated.value = !!(await authService.getUser())
  await loadTournaments()
})
</script>

<template>
  <div class="pb-16">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 pb-6">
      <div class="flex-1">
        <SearchInput
          v-model="searchQuery"
          :placeholder="t('public.tournaments.search')"
        />
      </div>

      <div class="shrink-0 self-stretch">
        <Listbox v-model="selectedSort" class="h-full">
          <div class="relative h-full">
            <ListboxButton
              class="relative h-full w-full cursor-pointer rounded-full bg-gray-100 pl-12 pr-10 text-left focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
            >
              <span
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <IconArrowsSort
                  class="size-6 text-gray-400 dark:text-gray-300"
                  aria-hidden="true"
                />
              </span>
              <span class="hidden flex-col justify-center md:flex">
                <span class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ t('public.tournaments.sort.sortBy') }}
                </span>
                <span
                  class="block truncate text-base font-medium text-gray-900 dark:text-white"
                >
                  {{ t(`public.tournaments.sort.${selectedSort}`) }}
                </span>
              </span>
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <ChevronDownIcon
                  class="size-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>

            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <ListboxOptions
                class="absolute right-0 z-10 mt-1 max-h-60 w-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-700"
              >
                <ListboxOption
                  v-for="option in Object.values(SortOption)"
                  :key="option"
                  v-slot="{ active, selected }"
                  :value="option"
                  as="template"
                >
                  <li
                    :class="[
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-900 dark:text-white',
                      'relative flex cursor-pointer select-none flex-row py-2 pl-3 pr-9',
                    ]"
                  >
                    <span
                      :class="[
                        selected ? 'font-semibold' : 'font-normal',
                        'block truncate',
                      ]"
                    >
                      {{ t(`public.tournaments.sort.${option}`) }}
                    </span>

                    <IconCheck
                      v-if="selected"
                      :class="[
                        active ? 'text-white' : 'text-indigo-600',
                        'absolute right-0 mr-4 size-5',
                      ]"
                    />
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
      <button
        v-for="status in STATUS_TABS"
        :key="status"
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="
          selectedStatus === status
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
        "
        @click="selectedStatus = status"
      >
        {{ t(`public.tournaments.tabs.${status}`) }}
        <span class="ml-1 opacity-60">{{ countByStatus[status] }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div v-for="index in 8" :key="index" class="space-y-3">
        <SkeletonLoader width="100%" height="180px" rounded="lg" />
        <SkeletonLoader width="70%" height="20px" />
        <SkeletonLoader width="45%" height="16px" />
      </div>
    </div>

    <!-- Tournaments grid -->
    <div
      v-else-if="visibleTournaments.length"
      class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4"
    >
      <TournamentCard
        v-for="tournament in visibleTournaments"
        :key="tournament.id"
        :tournament="tournament"
        :can-join="isAuthenticated"
        @join="handleJoin"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-4 py-16 text-center dark:border-white/10"
    >
      <div
        class="mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20"
      >
        <IconTrophy class="size-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 class="font-display font-semibold text-gray-900 dark:text-white">
        {{ t('public.tournaments.empty') }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('public.tournaments.emptyDescription') }}
      </p>
    </div>
  </div>
</template>

<style scoped></style>
