<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FunnelIcon } from '@heroicons/vue/20/solid'
import SearchInput from '@/components/SearchInput.vue'
import SortSelect from '@/components/SortSelect.vue'
import type { SortOption } from './tournaments.filters.ts'

withDefaults(
  defineProps<{
    search: string
    sort: SortOption
    sortOptions: { value: SortOption; label: string }[]
    // Filters narrowing the list right now, shown on the button since the
    // panel is closed by default.
    activeFilterCount?: number
  }>(),
  {
    activeFilterCount: 0,
  },
)

defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: SortOption]
  'open-filters': []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-4 pb-6">
    <div class="flex-1">
      <SearchInput
        :model-value="search"
        :placeholder="t('public.tournaments.search')"
        @update:model-value="$emit('update:search', $event)"
      />
    </div>

    <!-- Sort — in the toolbar wherever there is room for it -->
    <div class="hidden shrink-0 self-stretch md:block">
      <SortSelect
        :model-value="sort"
        :label="t('public.tournaments.sort.sortBy')"
        :options="sortOptions"
        @update:model-value="$emit('update:sort', $event)"
      />
    </div>

    <!-- Filter Button — the panel is only how narrow screens reach sort -->
    <div class="shrink-0 self-stretch md:hidden">
      <button
        type="button"
        class="flex h-full cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-5 py-4 text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-primary-400"
        @click="$emit('open-filters')"
      >
        <FunnelIcon class="size-6 text-gray-400" aria-hidden="true" />
        <span class="sr-only">
          {{ t('public.tournaments.filters.title') }}
        </span>
        <span
          v-if="activeFilterCount"
          class="inline-flex size-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
