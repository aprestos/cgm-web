<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SearchInput from '@/components/SearchInput.vue'
import TournamentSortSelect from './TournamentSortSelect.vue'
import type { SortOption } from './tournaments.filters.ts'

defineProps<{
  search: string
  sort: SortOption
}>()

defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: SortOption]
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

    <div class="shrink-0 self-stretch">
      <TournamentSortSelect
        :model-value="sort"
        @update:model-value="$emit('update:sort', $event)"
      />
    </div>
  </div>
</template>

<style scoped></style>
