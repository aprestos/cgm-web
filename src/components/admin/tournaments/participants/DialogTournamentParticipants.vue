<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import ParticipantsTable from './ParticipantsTable.vue'
import ParticipantsToolbar from './ParticipantsToolbar.vue'
import PersonPicker from '@/components/people/PersonPicker.vue'
import type {
  PersonPickerApi,
  PickedPerson,
} from '@/components/people/person.model.ts'
import logger from '@/lib/logger.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import {
  type CreateTournamentParticipant,
  participantEmail,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import tournamentParticipantsService from '@/features/tournaments/participants/service.ts'

const props = defineProps<{
  open: boolean
  tournament: Tournament | null
}>()

const emit = defineEmits<{
  close: []
  /** The roster changed, so counts elsewhere are stale */
  updated: []
}>()

const { t } = useI18n()

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const participants = ref<TournamentParticipant[]>([])
const isLoading = ref<boolean>(false)
const hasFailed = ref<boolean>(false)
const searchQuery = ref<string>('')

const isAddOpen = ref<boolean>(false)
const isAdding = ref<boolean>(false)
const picker = ref<PersonPickerApi | null>(null)

// The public sign-up honours maxParticipants, so the admin side holds the same
// line rather than quietly overbooking a tournament.
const isFull = computed<boolean>(
  () =>
    !!props.tournament &&
    participants.value.length >= props.tournament.maxParticipants,
)

async function loadParticipants(): Promise<void> {
  if (!props.tournament || !tenantStore.tenant || !editionStore.edition) return

  isLoading.value = true
  hasFailed.value = false

  try {
    participants.value = await tournamentParticipantsService.getAllByTournament(
      tenantStore.tenant.id,
      editionStore.edition.id,
      props.tournament.id,
    )
  } catch (error) {
    hasFailed.value = true
    participants.value = []
    logger.error('Failed to load tournament participants', {
      tournamentId: props.tournament.id,
      error,
    })
  } finally {
    isLoading.value = false
  }
}

async function handleUpdated(): Promise<void> {
  await loadParticipants()
  emit('updated')
}

/**
 * A ticket-backed sign-up is stored as the issuance — the attendee's name and
 * address live on the ticket, and copying them here would let the two drift.
 */
function toParticipant(person: PickedPerson): CreateTournamentParticipant {
  return person.ticketIssuanceId
    ? { ticketIssuanceId: person.ticketIssuanceId }
    : { participantName: person.name, participantEmail: person.email }
}

// Same person, two ways in: a second ticket for the same attendee is still a
// second spot, so only the issuance itself counts as a repeat there.
function isAlreadyIn(person: PickedPerson): boolean {
  if (person.ticketIssuanceId) {
    return participants.value.some(
      (participant) => participant.ticketIssuanceId === person.ticketIssuanceId,
    )
  }

  const email = person.email.toLowerCase()
  return participants.value.some(
    (participant) => participantEmail(participant).toLowerCase() === email,
  )
}

/**
 * The picker only names someone; the roster it goes on, and what counts as a
 * repeat on it, are this dialog's to know.
 */
async function addParticipant(): Promise<void> {
  if (!props.tournament || !tenantStore.tenant || !editionStore.edition) return

  // The picker reports on its own fields when there is no one to hand over.
  const person = await picker.value?.pick()
  if (!person) return

  if (isAlreadyIn(person)) {
    toast.error(
      t('admin.tournaments.participantsDialog.add.duplicate', {
        name: person.name,
      }),
    )
    return
  }

  isAdding.value = true
  try {
    await tournamentParticipantsService.create(
      tenantStore.tenant.id,
      editionStore.edition.id,
      props.tournament.id,
      [toParticipant(person)],
    )
    toast.success(
      t('admin.tournaments.participantsDialog.add.success', {
        name: person.name,
      }),
    )
    // Cleared rather than collapsed: rosters are filled in one go, so the next
    // name is usually right behind this one.
    picker.value?.reset()
    await handleUpdated()
  } catch (error) {
    logger.error('Failed to add a tournament participant', {
      tournamentId: props.tournament.id,
      error,
    })
    toast.error(t('admin.tournaments.participantsDialog.add.failed'))
  } finally {
    isAdding.value = false
  }
}

// Reloading on every open keeps the roster honest — sign-ups land while the
// admin is on this page. Collapsing the add panel unmounts it, which is what
// clears the half-filled form from last time.
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    searchQuery.value = ''
    participants.value = []
    isAddOpen.value = false
    await loadParticipants()
  },
)
</script>

<template>
  <DialogComponent
    :open="open"
    size="xl"
    :title="t('admin.tournaments.participantsDialog.title')"
    body-class="p-0"
    @close="emit('close')"
  >
    <template #header-sub-content>
      <p
        v-if="tournament"
        class="mt-1 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ tournament.title }} ·
        {{
          t('admin.tournaments.participantsDialog.count', {
            count: participants.length,
            max: tournament.maxParticipants,
          })
        }}
      </p>
    </template>

    <div class="flex flex-col">
      <ParticipantsToolbar
        v-model:query="searchQuery"
        v-model:add-open="isAddOpen"
        :full="isFull"
      />

      <!-- Collapsed to a single button until it is needed, so the roster keeps
           the room -->
      <div
        v-if="isAddOpen"
        class="px-4 pt-4 pb-4 sm:px-6 bg-slate-50 dark:bg-slate-800 border-t dark:border-t-slate-700 border-t-slate-100"
      >
        <!-- The picker names someone — whether off a ticket or off an account
             is its call, made from the tenant's settings. Adding them to the
             roster is this dialog's, so the button is too. -->
        <PersonPicker id="participant" ref="picker" :disabled="isAdding">
          <template #action>
            <CButton
              :loading="isAdding"
              :loading-text="
                t('admin.tournaments.participantsDialog.add.submitting')
              "
              @click="addParticipant"
            >
              {{ t('admin.tournaments.participantsDialog.add.submit') }}
            </CButton>
          </template>
        </PersonPicker>
      </div>

      <ParticipantsTable
        :participants="participants"
        :tournament="tournament"
        :loading="isLoading"
        :failed="hasFailed"
        :search-query="searchQuery"
      />
    </div>
  </DialogComponent>
</template>

<style scoped></style>
