<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import {
  IconCalendar,
  IconPlus,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import CButton from '@/components/CButton.vue'
import DialogCreateTournament from './DialogCreateTournament.vue'
import {
  type CreateTournament,
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import tournamentService from '@/features/tournaments/service.ts'
import { tenantStore } from '@/features/tenant/tenant.store.ts'
import { editionStore } from '@/features/events/edition.store.ts'
import { formatDayLabel } from '@/utils/date.ts'

const { t, locale } = useI18n()

// Sample data — replace with a service once tournaments are persisted.
const tournaments = ref<Tournament[]>([])

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-400/20',
  ongoing:
    'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-400/20',
  finished:
    'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10',
  cancelled:
    'bg-red-100 text-red-600 ring-red-500/20 dark:bg-white/5 dark:text-red-400 dark:ring-white/10',
}

const isCreateDialogOpen = ref<boolean>(false)

const handleCreate = (): void => {
  isCreateDialogOpen.value = true
}

const handleCreated = async (tournament: CreateTournament): Promise<void> => {
  toast.success(
    t('admin.tournaments.createSuccess', { title: tournament.title }),
  )
  await loadTournaments()
}

async function loadTournaments(): Promise<void> {
  if (!tenantStore.value || !editionStore.value) return

  try {
    tournaments.value = await tournamentService.getAll(
      tenantStore.value.id,
      editionStore.value.id,
    )
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    toast.error('Failed to load tournaments')
  }
}

onMounted(async () => {
  await loadTournaments()
})
</script>

<template>
  <div class="flex flex-col min-h-screen space-y-6 p-0 sm:p-6">
    <!-- Page Header -->
    <PageHeader
      class="p-6 sm:p-0"
      :title="t('admin.tournaments.title')"
      :description="t('admin.tournaments.description')"
      :action-label="t('admin.tournaments.newTournament')"
      @action="handleCreate"
    >
      <template #action-icon>
        <IconPlus class="size-5" stroke="2" />
      </template>
    </PageHeader>

    <!-- Tournaments grid -->
    <div
      v-if="tournaments.length"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-0"
    >
      <BaseCard v-for="tournament in tournaments" :key="tournament.id">
        <div class="flex flex-col h-full gap-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="flex items-center justify-center size-10 shrink-0 rounded-lg bg-amber-50 dark:bg-amber-900/20"
              >
                <IconTrophy class="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div class="min-w-0">
                <h3
                  class="font-display font-semibold text-gray-900 dark:text-white truncate"
                >
                  {{ tournament.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ tournament.organizer }}
                </p>
              </div>
            </div>
            <span
              class="inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
              :class="STATUS_BADGE[tournament.status]"
            >
              <span
                v-if="tournament.status === TournamentStatus.ongoing"
                class="size-1.5 rounded-full bg-current animate-pulse"
              />
              {{ t(`admin.tournaments.status.${tournament.status}`) }}
            </span>
          </div>

          <div
            class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-white/5"
          >
            <span class="inline-flex items-center gap-1.5">
              <IconCalendar class="size-4" />
              {{ formatDayLabel(tournament.startsAt, locale) }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <IconUsers class="size-4" />
              {{ tournament.participants }} / {{ tournament.maxParticipants }}
            </span>
          </div>

          <div
            class="inline-flex self-start rounded-md bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            {{ t(`admin.tournaments.format.${tournament.format}`) }}
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10"
    >
      <div
        class="flex items-center justify-center size-12 rounded-full bg-amber-50 dark:bg-amber-900/20 mb-4"
      >
        <IconTrophy class="size-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 class="font-display font-semibold text-gray-900 dark:text-white">
        {{ t('admin.tournaments.empty') }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('admin.tournaments.emptyDescription') }}
      </p>
      <CButton class="mt-6" @click="handleCreate">
        <template #icon-left>
          <IconPlus class="size-5" stroke="2" />
        </template>
        {{ t('admin.tournaments.newTournament') }}
      </CButton>
    </div>

    <!-- Create tournament dialog -->
    <DialogCreateTournament
      :open="isCreateDialogOpen"
      @close="isCreateDialogOpen = false"
      @created="handleCreated"
    />
  </div>
</template>

<style scoped></style>
