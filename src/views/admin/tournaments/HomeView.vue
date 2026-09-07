<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { IconPlus, IconTrophy } from '@tabler/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import CButton from '@/components/CButton.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import DialogCreateTournament from './DialogCreateTournament.vue'
import DialogEditTournament from './DialogEditTournament.vue'
import DialogTournamentParticipants from './DialogTournamentParticipants.vue'
import TournamentCard from './TournamentCard.vue'
import type {
  CreateTournament,
  Tournament,
} from '@/features/tournaments/tournament.model.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import tournamentService from '@/features/tournaments/events/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t } = useI18n()

const tournaments = ref<Tournament[]>([])
const isLoading = ref<boolean>(true)
const isCreateDialogOpen = ref<boolean>(false)
// Kept set while the dialog closes so its content does not blank out mid-transition
const editTournament = ref<Tournament | null>(null)
const isEditDialogOpen = ref<boolean>(false)
const participantsTournament = ref<Tournament | null>(null)
const isParticipantsDialogOpen = ref<boolean>(false)

const handleCreate = (): void => {
  isCreateDialogOpen.value = true
}

const handleCreated = async (tournament: CreateTournament): Promise<void> => {
  toast.success(
    t('admin.tournaments.createSuccess', { title: tournament.title }),
  )
  await loadTournaments()
}

const handleEdit = (tournament: Tournament): void => {
  editTournament.value = tournament
  isEditDialogOpen.value = true
}

// Each section of the edit dialog saves on its own, so the list is brought
// back in step as they land rather than once at the end.
const handleUpdated = async (): Promise<void> => {
  await loadTournaments()
}

// The full roster is a table, which the edit dialog's column has no room for.
const handleManageParticipants = (tournament: Tournament): void => {
  isEditDialogOpen.value = false
  handleParticipants(tournament)
}

const handleParticipants = (tournament: Tournament): void => {
  participantsTournament.value = tournament
  isParticipantsDialogOpen.value = true
}

async function loadTournaments(): Promise<void> {
  if (!tenantStore.tenant || !editionStore.edition) {
    isLoading.value = false
    return
  }

  try {
    tournaments.value = await tournamentService.getAll(
      tenantStore.tenant.id,
      editionStore.edition.id,
    )
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    toast.error(t('admin.tournaments.loadFailed'))
  } finally {
    isLoading.value = false
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

    <!-- Loading — mirrors the card grid so the layout does not jump -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-0"
    >
      <div
        v-for="index in 6"
        :key="index"
        class="rounded-2xl bg-white p-4 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
      >
        <div class="flex items-center gap-3">
          <SkeletonLoader class-name="size-10 shrink-0" rounded="lg" />
          <div class="flex-1 space-y-2">
            <SkeletonLoader class-name="h-4 w-2/3" />
            <SkeletonLoader class-name="h-3 w-1/3" />
          </div>
        </div>
        <SkeletonLoader class-name="mt-4 h-3 w-1/2" />
        <SkeletonLoader class-name="mt-4 h-1.5 w-full" rounded="full" />
      </div>
    </div>

    <!-- Tournaments grid -->
    <div
      v-else-if="tournaments.length"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 sm:px-0"
    >
      <TournamentCard
        v-for="tournament in tournaments"
        :key="tournament.id"
        :tournament="tournament"
        @edit="handleEdit"
        @participants="handleParticipants"
      />
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

    <!-- Edit tournament dialog -->
    <DialogEditTournament
      :open="isEditDialogOpen"
      :tournament="editTournament"
      @close="isEditDialogOpen = false"
      @updated="handleUpdated"
      @participants="handleManageParticipants"
    />

    <!-- Participants dialog -->
    <DialogTournamentParticipants
      :open="isParticipantsDialogOpen"
      :tournament="participantsTournament"
      @updated="handleUpdated"
      @close="isParticipantsDialogOpen = false"
    />
  </div>
</template>

<style scoped></style>
