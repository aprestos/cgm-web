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
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { IconCheck, IconPlus, IconTicket } from '@tabler/icons-vue'
import { v4 as uuidv4 } from 'uuid'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TournamentParticipantRow from './TournamentParticipantRow.vue'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import type { User } from '@/features/auth/user.model.ts'
import {
  participantInitials,
  type CreateTournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import type { TicketIssuance } from '@/features/tickets/ticket.model.ts'
import ticketIssuanceService from '@/features/tickets/issuance.service.ts'
import { settingsStore } from '@/features/settings/useSettings.store.ts'
import { tenantStore } from '@/features/tenant/tenant.store.ts'
import { editionStore } from '@/features/events/edition.store.ts'
import { slotsLeft as remainingSlots } from '@/views/public/tournaments/tournaments.filters.ts'
import logger from '@/lib/logger.ts'

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
  () => settingsStore.value?.tickets?.enabled ?? false,
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
  if (!props.user || !tenantStore.value || !editionStore.value) return

  loadingIssuances.value = true
  try {
    issuances.value = await ticketIssuanceService.getByUser(
      tenantStore.value.id,
      editionStore.value.id,
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
      <label
        id="ticket-holder-label"
        class="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        {{ t('public.tournaments.joinDialog.fromTicketHolders') }}
      </label>
      <Listbox v-model="pickedIssuanceId" as="div" class="relative mt-2">
        <ListboxButton
          aria-labelledby="ticket-holder-label"
          class="relative block w-full cursor-pointer rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-primary-500"
        >
          <span v-if="pickedIssuance" class="block truncate py-0.5">
            {{ issuanceLabel(pickedIssuance) }}
          </span>
          <span
            v-else
            class="block truncate py-0.5 text-gray-400 dark:text-gray-500"
          >
            {{ t('public.tournaments.joinDialog.selectTicket') }}
          </span>
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <ChevronDownIcon class="size-5 text-gray-400" aria-hidden="true" />
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
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-700"
          >
            <ListboxOption
              v-for="issuance in unusedIssuances"
              :key="issuance.id"
              v-slot="{ active: highlighted, selected }"
              :value="issuance.id"
              as="template"
            >
              <li
                :class="[
                  highlighted
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-900 dark:text-white',
                  'relative cursor-pointer select-none py-2 pl-3 pr-9',
                ]"
              >
                <span
                  :class="[
                    selected ? 'font-semibold' : 'font-normal',
                    'flex items-center gap-2 truncate',
                  ]"
                >
                  <IconTicket class="size-4 shrink-0 opacity-60" />
                  {{ issuanceLabel(issuance) }}
                </span>
                <span
                  v-if="issuance.attendeeName?.trim()"
                  :class="[
                    highlighted
                      ? 'text-primary-100'
                      : 'text-gray-500 dark:text-gray-400',
                    'ml-6 block truncate text-xs',
                  ]"
                >
                  {{ issuance.attendeeEmail }}
                </span>

                <IconCheck
                  v-if="selected"
                  :class="[
                    highlighted ? 'text-white' : 'text-primary-600',
                    'absolute right-0 top-2 mr-4 size-5',
                  ]"
                />
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </Listbox>
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
