<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegle } from '@regle/core'
import {
  email as emailRule,
  maxLength,
  minLength,
  required,
} from '@regle/rules'
import { IconPlus, IconTicket } from '@tabler/icons-vue'
import { v4 as uuidv4 } from 'uuid'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CSelect from '@/components/CSelect.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TournamentParticipantRow from '@/features/tournaments/components/TournamentParticipantRow.vue'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import type { User } from '@/features/auth/user.model.ts'
import {
  participantInitials,
  type CreateTournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import type { TicketIssuance } from '@/features/tickets/ticket.model.ts'
import ticketIssuanceService from '@/features/tickets/issuance.service.ts'
import { useSettingsStore } from '@/features/settings/useSettings.store'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import { slotsLeft as remainingSlots } from '@/views/public/tournaments/tournaments.filters.ts'
import logger from '@/lib/logger.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()
const settingsStore = useSettingsStore()

// One staged sign-up. With tickets enabled the name comes from the picked
// issuance, otherwise it is typed by hand.
interface StagedParticipant {
  key: string
  name: string
  email: string
  issuanceId: string | null
}

/** A sign-up already saved on the server, listed above the staged ones */
interface ExistingParticipant {
  id: string
  name: string
  initials: string
  fromTicket: boolean
}

interface Props {
  tournament: Tournament | null
  user: User | null
  /** Flipped on when the form becomes visible, so it starts from a clean sheet */
  active: boolean
  /** The people the current user already signed up for this tournament */
  existing?: ExistingParticipant[]
}

const props = withDefaults(defineProps<Props>(), {
  existing: () => [],
})

const emit = defineEmits<{
  // Names of everyone being signed up — nobody is added on their behalf.
  confirm: [participants: CreateTournamentParticipant[]]
}>()

const { t } = useI18n()

const isSubmitting = ref<boolean>(false)
const staged = ref<StagedParticipant[]>([])
const pickedIssuanceId = ref<string | null>(null)
const error = ref<string>('')

// The row being composed. Only used when there is no ticketing to pick from.
const draft = reactive<{ name: string; email: string }>({ name: '', email: '' })

const { r$ } = useRegle(draft, {
  name: { required, minLength: minLength(2), maxLength: maxLength(80) },
  email: { email: emailRule },
})

const ticketsEnabled = computed<boolean>(
  () => settingsStore.settings?.tickets?.enabled ?? false,
)

const issuances = ref<TicketIssuance[]>([])
const loadingIssuances = ref<boolean>(false)
const issuancesError = ref<boolean>(false)

const slotsLeft = computed<number>(() =>
  props.tournament ? remainingSlots(props.tournament) : 0,
)

const stagedCount = computed<number>(() => staged.value.length)

const takenIssuanceIds = computed<Set<string>>(
  () =>
    new Set(
      staged.value
        .map((participant) => participant.issuanceId)
        .filter((id): id is string => id !== null),
    ),
)

// A ticket can only back a single participant, so used ones drop off the list.
const unusedIssuances = computed<TicketIssuance[]>(() =>
  issuances.value.filter(
    (issuance) => !takenIssuanceIds.value.has(issuance.id),
  ),
)

const isFull = computed<boolean>(() => stagedCount.value >= slotsLeft.value)

const canAddParticipant = computed<boolean>(() => {
  if (isFull.value) return false
  if (!ticketsEnabled.value) return true
  return unusedIssuances.value.length > 0
})

const addDisabled = computed<boolean>(
  () =>
    !canAddParticipant.value ||
    (ticketsEnabled.value && !pickedIssuanceId.value),
)

const canSubmit = computed<boolean>(() => stagedCount.value > 0)

const issuanceLabel = (issuance: TicketIssuance): string =>
  issuance.attendeeName?.trim() || issuance.attendeeEmail

const issuanceOptions = computed(() =>
  unusedIssuances.value.map((issuance) => ({
    value: issuance.id,
    label: issuanceLabel(issuance),
    // The email only disambiguates when a holder name was given.
    secondaryLabel: issuance.attendeeName?.trim()
      ? issuance.attendeeEmail
      : undefined,
  })),
)

const pickedIssuance = computed<TicketIssuance | undefined>(() =>
  issuances.value.find((issuance) => issuance.id === pickedIssuanceId.value),
)

// Why the picker is not there. Each case reads differently to the user: no
// tickets at all, all of them already on the list, or the list simply failing.
const ticketsNote = computed<string>(() => {
  if (!ticketsEnabled.value) return ''
  if (!issuances.value.length)
    return t('public.tournaments.joinDialog.noTickets')
  if (!unusedIssuances.value.length)
    return t('public.tournaments.joinDialog.allTicketsUsed')
  return ''
})

const addParticipant = async (): Promise<void> => {
  error.value = ''

  if (isFull.value) {
    error.value = t('public.tournaments.joinDialog.noMoreSlots')
    return
  }

  if (ticketsEnabled.value) {
    const issuance = pickedIssuance.value
    if (!issuance) {
      error.value = t('public.tournaments.joinDialog.pickTicketFirst')
      return
    }

    staged.value.push({
      key: uuidv4(),
      name: issuanceLabel(issuance),
      email: issuance.attendeeEmail,
      issuanceId: issuance.id,
    })
    pickedIssuanceId.value = null
    return
  }

  const { valid } = await r$.$validate()
  if (!valid) return

  staged.value.push({
    key: uuidv4(),
    name: draft.name.trim(),
    email: draft.email.trim(),
    issuanceId: null,
  })
  draft.name = ''
  draft.email = ''
  r$.$reset()
}

const removeParticipant = (key: string): void => {
  staged.value = staged.value.filter((participant) => participant.key !== key)
  error.value = ''
}

const loadIssuances = async (): Promise<void> => {
  issuances.value = []
  issuancesError.value = false

  if (!ticketsEnabled.value) return
  if (!props.user || !tenantStore.tenant || !editionStore.edition) return

  loadingIssuances.value = true
  try {
    issuances.value = await ticketIssuanceService.getByUser(
      tenantStore.tenant.id,
      editionStore.edition.id,
      props.user.id,
    )
  } catch (loadError) {
    logger.error('Unable to load the tickets of the current user', {
      error: loadError,
    })
    issuancesError.value = true
  } finally {
    loadingIssuances.value = false
  }
}

const submit = (): void => {
  if (isSubmitting.value || !staged.value.length) return

  isSubmitting.value = true
  try {
    emit(
      'confirm',
      staged.value.map((participant) =>
        participant.issuanceId
          ? { ticketIssuanceId: participant.issuanceId }
          : {
              participantName: participant.name,
              participantEmail: participant.email || undefined,
            },
      ),
    )
  } finally {
    isSubmitting.value = false
  }
}

// Every opening starts from a clean sheet: nothing staged, no errors.
watch(
  () => props.active,
  async (active) => {
    if (!active) return
    staged.value = []
    pickedIssuanceId.value = null
    draft.name = ''
    draft.email = ''
    error.value = ''
    r$.$reset()
    await loadIssuances()
  },
  { immediate: true },
)

// The footer of the dialog owns the confirm button, so it drives the form
// from the outside — see TournamentSignUpFormInstance for the shape.
defineExpose({ submit, canSubmit, isSubmitting, stagedCount })
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="addParticipant">
    <!-- Loading the tickets bought by the current user -->
    <div v-if="loadingIssuances" class="flex flex-col gap-2">
      <SkeletonLoader
        v-for="index in 2"
        :key="index"
        width="100%"
        height="38px"
        rounded="lg"
      />
    </div>

    <p
      v-else-if="issuancesError"
      class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
    >
      {{ t('public.tournaments.joinDialog.ticketsError') }}
    </p>

    <p
      v-else-if="ticketsNote"
      class="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400"
    >
      {{ ticketsNote }}
    </p>

    <!-- Ticket holders the user paid for -->
    <div v-else-if="ticketsEnabled">
      <CSelect
        id="ticket-holder"
        v-model="pickedIssuanceId"
        :label="t('public.tournaments.joinDialog.fromTicketHolders')"
        :placeholder="t('public.tournaments.joinDialog.selectTicket')"
        :items="issuanceOptions"
      >
        <!-- A ticket row is two lines with a leading icon; the row chrome
             (tint, check, padding) still comes from CSelectOption. -->
        <template #option="{ option, selected: isSelected }">
          <span
            class="flex items-center gap-2 truncate"
            :class="isSelected ? 'font-medium' : 'font-normal'"
          >
            <IconTicket class="size-4 shrink-0 opacity-60" />
            {{ option.label }}
          </span>
          <span
            v-if="option.secondaryLabel"
            class="ml-6 block truncate text-xs"
            :class="
              isSelected
                ? 'text-primary-500 dark:text-primary-400/80'
                : 'text-gray-500 dark:text-gray-400'
            "
          >
            {{ option.secondaryLabel }}
          </span>
        </template>
      </CSelect>
    </div>

    <!-- No ticketing: the name and email are typed in -->
    <template v-else>
      <CInput
        id="participant-name"
        v-model="draft.name"
        :label="t('public.tournaments.joinDialog.fullName')"
        :placeholder="t('public.tournaments.joinDialog.namePlaceholder')"
        :errors="r$.$fields.name.$errors"
      />
      <CInput
        id="participant-email"
        v-model="draft.email"
        type="email"
        :label="t('public.tournaments.joinDialog.email')"
        :placeholder="t('public.tournaments.joinDialog.emailPlaceholder')"
        :errors="r$.$fields.email.$errors"
      />
    </template>

    <CButton
      v-if="!loadingIssuances && !issuancesError"
      type="submit"
      variant="soft"
      size="lg"
      full-width
      :disabled="addDisabled"
    >
      <template #icon-left>
        <IconPlus class="size-4" />
      </template>
      {{ t('public.tournaments.joinDialog.addParticipant') }}
    </CButton>

    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <!-- One roster: the sign-ups already saved, then the ones about to be -->
    <ul
      v-if="existing.length || staged.length"
      class="flex flex-col gap-1.5"
      :aria-label="t('public.tournaments.joinDialog.participants')"
    >
      <TournamentParticipantRow
        v-for="participant in existing"
        :key="participant.id"
        :name="participant.name"
        :initials="participant.initials"
        :from-ticket="participant.fromTicket"
        :detail="t('public.tournaments.joinDialog.alreadySignedUp')"
      />
      <TournamentParticipantRow
        v-for="participant in staged"
        :key="participant.key"
        :name="participant.name"
        :initials="participantInitials(participant.name)"
        :from-ticket="!!participant.issuanceId"
        :detail="participant.email || undefined"
        removable
        @remove="removeParticipant(participant.key)"
      />
    </ul>

    <p
      v-else
      class="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-400 dark:border-white/15 dark:text-gray-500"
    >
      {{ t('public.tournaments.joinDialog.noParticipantsYet') }}
    </p>
  </form>
</template>

<style scoped></style>
