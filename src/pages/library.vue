<template>
  <div class="pb-32">
    <main>
      <div class="flex items-center gap-4 pb-6">
        <!-- Search Input -->
        <div class="flex-1">
          <CSearchInput
            v-model="searchQuery"
            :placeholder="t('public.library.search')"
            size="lg"
            rounded
          />
        </div>

        <!-- Sort — in the toolbar wherever there is room for it -->
        <div class="hidden shrink-0 self-stretch md:block">
          <SortSelect
            v-model="selectedSort"
            :label="t('public.library.sort.sortBy')"
            :options="sortOptions"
          />
        </div>

        <!-- Filter Button — only until the panel is pinned to the page -->
        <div class="shrink-0 self-stretch lg:hidden">
          <button
            type="button"
            class="flex h-full cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-5 py-4 text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-primary-400"
            @click="filtersOpen = true"
          >
            <FunnelIcon class="size-6 text-gray-400" aria-hidden="true" />
            <span class="sr-only">{{ t('public.library.filters.title') }}</span>
            <span
              v-if="activeFilterCount"
              class="inline-flex size-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white"
            >
              {{ activeFilterCount }}
            </span>
          </button>
        </div>
      </div>

      <FilterChips
        :chips="appliedFilters"
        @remove="removeFilter"
        @clear="clearFilters"
      />

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" class="sr-only">
          {{ t('public.library.games') }}
        </h2>

        <div class="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
          <!-- A column once the page is wide enough to spare it, a slide-over
               below that -->
          <FilterSidebar
            v-model:open="filtersOpen"
            :title="t('public.library.filters.title')"
            pinned-from="lg"
          >
            <!-- Sort only lives here while the toolbar has no room for it -->
            <div
              class="border-b border-gray-200 md:hidden dark:border-gray-700"
            >
              <FilterRadioGroup
                v-model="selectedSort"
                :label="t('public.library.sort.sortBy')"
                :options="sortOptions"
              />
            </div>

            <LibraryFilters
              :selected-tag="selectedTag"
              :selected-filters="selectedFilters"
              :sub-categories="subCategories"
              :filters="filters"
              @select-tag="selectTag"
              @toggle-filter="toggleFilter"
            />
          </FilterSidebar>

          <div class="lg:col-span-3">
            <GameList :filters="currentFilters" />
          </div>
        </div>
      </section>
    </main>

    <!-- Offset off the bottom edge, not padded away from it: a fixed box that
         reaches bottom:0 makes iOS Safari turn its translucent toolbar solid. -->
    <div
      class="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0.5rem)] px-2 flex items-center justify-center"
    >
      <ReservationList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouteNames } from '@/router/routeNames'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  IconMoodKidFilled,
  IconPlayCard2Filled,
  IconTrophyFilled,
  IconUsersGroup,
} from '@tabler/icons-vue'
import CSearchInput from '@/components/CSearchInput.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import FilterRadioGroup from '@/components/FilterRadioGroup.vue'
import FilterChips from '@/components/FilterChips.vue'
import type { FilterChip } from '@/components/filterChips.model.ts'
import SortSelect from '@/components/SortSelect.vue'
import GameList from '@/components/library/GameList.vue'
import ReservationList from '@/components/library/ReservationList.vue'
import LibraryFilters from '@/components/library/LibraryFilters.vue'
import {
  type FilterOptions,
  SortOption,
} from '@/features/library/games/service.ts'
import { FunnelIcon, SparklesIcon } from '@heroicons/vue/20/solid'
import { useSeo } from '@/composables/useSeo'
import { useJsonLd } from '@/composables/useJsonLd'
import { useLibraryGames } from '@/features/library/games/useLibraryGames'
import { useRoute } from 'vue-router'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

definePageMeta({
  layout: 'public',
  name: RouteNames.public.library,
})

const { t } = useI18n()

const tenantStore = useTenantStore()
const editionStore = useEditionStore()
const route = useRoute()

// Awaited before anything below reads it, head computeds included — see
// `useLibraryGames`.
const games = await useLibraryGames()

const siteName = computed(
  () => editionStore.edition?.name ?? tenantStore.tenant?.name ?? '',
)

// Which twenty this URL is. `GameList` decides the window; this only needs the
// number, for the title and the canonical.
const page = computed(() => {
  const raw = route.query.page
  const asked = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(asked) && asked > 1 ? asked : 1
})

useSeo({
  // A page number in the title, so the pages of the library are not a run of
  // identical entries in a results list.
  title: () =>
    page.value > 1
      ? `${t('public.library.title')} · ${t('public.library.seo.page', { page: page.value })}`
      : t('public.library.title'),
  description: () =>
    games.value.length > 0
      ? t('public.library.seo.withCount', {
          count: games.value.length,
          name: siteName.value,
        })
      : t('public.library.seo.description', { name: siteName.value }),
  // `?page` is the one parameter that says which page this is; every other one
  // would fork the library into copies of itself.
  canonicalQuery: ['page'],
})

/**
 * The games, as a list a search engine can read.
 *
 * Only the ones this URL shows, with `position` counted from the start of the
 * whole library rather than the page — the numbering is what tells a search
 * engine these pages are one list in a sequence. Step 7 item 4 of
 * `docs/ssr-migration.md`.
 *
 * No `url` per game: opening one is a dialog, not a page, so there is nowhere
 * to point.
 */
const GAMES_PER_PAGE = 20

useJsonLd(() => {
  const from = (page.value - 1) * GAMES_PER_PAGE
  const shown = games.value.slice(from, from + GAMES_PER_PAGE)
  if (shown.length === 0) return null

  return {
    '@type': 'ItemList',
    name: t('public.library.title'),
    numberOfItems: games.value.length,
    itemListElement: shown.map((entry, index) => ({
      '@type': 'ListItem',
      position: from + index + 1,
      item: {
        '@type': 'Game',
        name: entry.game?.name,
        ...(entry.game?.image ? { image: entry.game.image } : {}),
      },
    })),
  }
})

const searchQuery = ref('')
const selectedFilters = ref<Record<string, string[]>>({})
const selectedTag = ref<string>('')
const selectedSort = ref<SortOption>(SortOption.DEFAULT)

const sortOptions = computed(() =>
  Object.values(SortOption).map((option) => ({
    value: option,
    label: t(`public.library.sort.${option}`),
  })),
)

// Every applied filter, spelled out for the chips. Sort is left out: it always
// has a value, so it is never something the user can take off.
const appliedFilters = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = []

  if (selectedTag.value)
    chips.push({
      id: `tag:${selectedTag.value}`,
      label: t(`public.library.filters.${selectedTag.value}`),
    })

  for (const [sectionId, values] of Object.entries(selectedFilters.value)) {
    const section = filters.find((entry) => entry.id === sectionId)

    for (const value of values) {
      const option = section?.options.find((entry) => entry.value === value)
      chips.push({
        id: `${sectionId}:${value}`,
        // The value alone ("3", "60 min") does not say what it filters.
        label: `${t(`public.library.filters.${sectionId}`)}: ${option?.label ?? value}`,
      })
    }
  }

  return chips
})

const activeFilterCount = computed<number>(() => appliedFilters.value.length)

const removeFilter = (id: string): void => {
  const separator = id.indexOf(':')
  const sectionId = id.slice(0, separator)
  const value = id.slice(separator + 1)

  if (sectionId === 'tag') {
    selectedTag.value = ''
    return
  }

  const values = selectedFilters.value[sectionId]
  if (!values) return

  selectedFilters.value[sectionId] = values.filter((entry) => entry !== value)
}

const clearFilters = (): void => {
  selectedTag.value = ''
  selectedFilters.value = {}
}

// Computed property to create the proper filter structure
const currentFilters = computed((): FilterOptions => {
  // Remove empty arrays from selectedFilters
  const cleanedFilters = Object.fromEntries(
    Object.entries(selectedFilters.value).filter(
      ([, values]) => values.length > 0,
    ),
  )

  // Add selected tag to filters if one is selected
  if (selectedTag.value) {
    cleanedFilters.tags = [selectedTag.value]
  }

  return {
    searchQuery: searchQuery.value || undefined,
    selectedFilters:
      Object.keys(cleanedFilters).length > 0 ? cleanedFilters : undefined,
    selectedSort: selectedSort.value || undefined,
  }
})

const subCategories = [
  { id: 'new-arrivals', href: '#', icon: SparklesIcon },
  { id: 'family', href: '#', icon: IconUsersGroup },
  { id: 'classics', href: '#', icon: IconTrophyFilled },
  { id: 'children', href: '#', icon: IconMoodKidFilled },
  {
    id: 'two-player-only',
    href: '#',
    icon: IconPlayCard2Filled,
  },
]
const filters = [
  {
    id: 'players',
    options: [
      { value: '1', label: '1', checked: false },
      { value: '2', label: '2', checked: false },
      { value: '3', label: '3', checked: true },
      { value: '4', label: '4', checked: false },
      { value: '5', label: '5', checked: false },
      { value: '6', label: '6', checked: false },
      { value: '7', label: '7', checked: false },
      { value: '8', label: '8', checked: false },
      { value: '9', label: '9', checked: false },
      { value: '10+', label: '10+', checked: false },
    ],
  },
  {
    id: 'playtime',
    options: [
      { value: '15', label: '15 min', checked: false },
      { value: '30', label: '30 min', checked: false },
      { value: '60', label: '60 min', checked: false },
      { value: '90', label: '90 min', checked: false },
      { value: '120', label: '120 min', checked: false },
      { value: '180', label: '180 min', checked: false },
      { value: '240', label: '240 min', checked: false },
    ],
  },
]

const filtersOpen = ref(false)

// Tag management functions
const selectTag = (tagName: string): void => {
  if (selectedTag.value === tagName) {
    // Deselect if clicking the same tag
    selectedTag.value = ''
  } else {
    // Select the new tag
    selectedTag.value = tagName
  }
}

// Filter management functions

const toggleFilter = (sectionId: string, value: string, event: Event): void => {
  const target = event.target as HTMLInputElement

  if (!selectedFilters.value[sectionId]) {
    selectedFilters.value[sectionId] = []
  }

  if (target.checked) {
    // Add filter
    if (!selectedFilters.value[sectionId].includes(value)) {
      selectedFilters.value[sectionId].push(value)
    }
  } else {
    // Remove filter
    const index = selectedFilters.value[sectionId].indexOf(value)
    if (index > -1) {
      selectedFilters.value[sectionId].splice(index, 1)
    }
  }
}
</script>
