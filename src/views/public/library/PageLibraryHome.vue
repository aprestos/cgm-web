<template>
  <div class="pb-32">
    <div>
      <!-- Mobile filter dialog -->
      <TransitionRoot as="template" :show="mobileFiltersOpen">
        <Dialog
          class="relative z-40 lg:hidden"
          @close="mobileFiltersOpen = false"
        >
          <TransitionChild
            as="template"
            enter="transition-opacity ease-linear duration-300"
            enter-from="opacity-0"
            enter-to=""
            leave="transition-opacity ease-linear duration-300"
            leave-from=""
            leave-to="opacity-0"
          >
            <div class="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div class="fixed inset-0 z-40 flex">
            <TransitionChild
              as="template"
              enter="transition ease-in-out duration-300 transform"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <DialogPanel
                class="relative ml-auto flex size-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-gray-800 pt-4 pb-6 shadow-xl"
              >
                <div class="flex items-center justify-between px-4">
                  <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ t('library.filters.title') }}
                  </h2>
                  <button
                    type="button"
                    class="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white dark:bg-gray-800 p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    @click="mobileFiltersOpen = false"
                  >
                    <span class="absolute -inset-0.5" />
                    <span class="sr-only">{{ t('library.closeMenu') }}</span>
                    <XMarkIcon class="size-6" aria-hidden="true" />
                  </button>
                </div>

                <!-- Filters -->
                <div class="mt-4 border-t border-gray-200 dark:border-gray-700">
                  <LibraryFilters
                    is-mobile
                    :selected-tag="selectedTag"
                    :selected-filters="selectedFilters"
                    :sub-categories="subCategories"
                    :filters="filters"
                    @select-tag="selectTag"
                    @toggle-filter="toggleFilter"
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </TransitionRoot>

      <main>
        <div class="flex items-center gap-4 pb-6">
          <!-- Search Input -->
          <div class="flex-1">
            <SearchInput
              v-model="searchQuery"
              :placeholder="t('library.search')"
            />
          </div>

          <!-- Sort Combobox -->
          <div class="shrink-0 self-stretch">
            <Listbox v-model="selectedSort" class="h-full">
              <div class="relative h-full">
                <ListboxButton
                  class="relative w-full h-full cursor-pointer rounded-full bg-gray-100 dark:bg-gray-700 pl-12 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                >
                  <span
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                  >
                    <IconArrowsSort
                      class="h-6 w-6 text-gray-400 dark:text-gray-300"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="hidden md:flex flex-col justify-center">
                    <span
                      class="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                    >
                      {{ t('library.sort.sortBy') }}
                    </span>
                    <span
                      class="block truncate text-base font-medium text-gray-900 dark:text-white"
                    >
                      {{
                        selectedSort
                          ? t(`library.sort.${selectedSort}`)
                          : t(`library.sort.${SortOption.DEFAULT}`)
                      }}
                    </span>
                  </span>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
                  >
                    <ChevronDownIcon
                      class="h-5 w-5 text-gray-400"
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
                    class="absolute z-10 mt-1 max-h-60 w-60 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-gray-700 focus:outline-none sm:text-sm"
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
                          'relative flex flex-row cursor-pointer select-none py-2 pl-3 pr-9',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-semibold' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ t('library.sort.' + option) }}
                        </span>

                        <IconCheck
                          v-if="selected"
                          :class="[
                            active ? 'text-white' : 'text-indigo-600',
                            'size-5 absolute right-0 mr-4',
                          ]"
                        />
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>
          </div>

          <!-- Filter Button -->
          <div class="shrink-0 lg:hidden self-stretch">
            <button
              type="button"
              class="h-full px-5 py-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors flex items-center gap-2"
              @click="mobileFiltersOpen = true"
            >
              <FunnelIcon class="size-6 text-gray-400" aria-hidden="true" />
              <span class="sr-only">{{ t('library.filters') }}</span>
            </button>
          </div>
        </div>

        <section aria-labelledby="products-heading" class="">
          <h2 id="products-heading" class="sr-only">
            {{ t('library.games') }}
          </h2>

          <div class="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            <!-- Filters -->
            <div class="hidden lg:block">
              <LibraryFilters
                :selected-tag="selectedTag"
                :selected-filters="selectedFilters"
                :sub-categories="subCategories"
                :filters="filters"
                @select-tag="selectTag"
                @toggle-filter="toggleFilter"
              />
            </div>

            <div class="lg:col-span-3">
              <GameList :filters="currentFilters" />
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- Sticky bottom container -->
    <div
      class="fixed bottom-0 left-0 right-0 p-2 flex items-center justify-center"
    >
      <ReservationList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  IconArrowsSort,
  IconCheck,
  IconMoodKidFilled,
  IconPlayCard2Filled,
  IconTrophyFilled,
  IconUsersGroup,
} from '@tabler/icons-vue'
import SearchInput from '@/components/SearchInput.vue'
import GameList from '@/views/public/library/GameList.vue'
import ReservationList from '@/views/public/library/ReservationList.vue'
import LibraryFilters from '@/views/public/library/LibraryFilters.vue'
import {
  type FilterOptions,
  SortOption,
} from '@/features/library/games/service.ts'
import {
  Dialog,
  DialogPanel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import {
  ChevronDownIcon,
  FunnelIcon,
  SparklesIcon,
} from '@heroicons/vue/20/solid'

const { t } = useI18n()

const searchQuery = ref('')
const selectedFilters = ref<Record<string, string[]>>({})
const selectedTag = ref<string>('')
const selectedSort = ref<SortOption>(SortOption.DEFAULT)

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

const mobileFiltersOpen = ref(false)

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
