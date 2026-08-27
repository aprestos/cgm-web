<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import TournamentDetailsFacts from './TournamentDetailsFacts.vue'
import TournamentDetailsPrizes from './TournamentDetailsPrizes.vue'
import TournamentDetailsAbout from './TournamentDetailsAbout.vue'
import TournamentDetailsRoster from './TournamentDetailsRoster.vue'
import type { TournamentDetailsRosterInstance } from './tournamentDetailsRoster.model.ts'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import type {
  CreateTournamentParticipant,
  TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import type { User } from '@/features/auth/user.model.ts'
import { slotsLeft as remainingSlots } from '@/views/public/tournaments/tournaments.filters.ts'

interface Props {
  open: boolean
  tournament: Tournament | null
  /** The people the current user already signed up for this tournament */
  participants: TournamentParticipant[]
  user: User | null
  canJoin?: boolean
  /** Set when the dialog was opened from the join/edit button on the card */
  focusSignUp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canJoin: false,
  focusSignUp: false,
})

const emit = defineEmits<{
  close: []
  confirm: [participants: CreateTournamentParticipant[]]
}>()

const { t } = useI18n()

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled: 'bg-white/90 text-gray-900 dark:bg-gray-900/90 dark:text-white',
  ongoing: 'bg-green-500 text-white',
  finished: 'bg-gray-900/80 text-white dark:bg-white/15',
  cancelled: 'bg-red-500 text-white',
}

const roster = useTemplateRef<TournamentDetailsRosterInstance>('roster')

const image = computed<string | undefined>(
  () => props.tournament?.cover || props.tournament?.thumbnail || undefined,
)

const slotsLeft = computed<number>(() =>
  props.tournament ? remainingSlots(props.tournament) : 0,
)

const isFull = computed<boolean>(() => slotsLeft.value === 0)

// Only tournaments that haven't started yet are open for sign-ups.
const isOpen = computed<boolean>(
  () =>
    props.tournament?.status === TournamentStatus.scheduled && !isFull.value,
)

const canSignUp = computed<boolean>(() => props.canJoin && isOpen.value)

// The dialog is reachable while signed out, so the sign-up section explains
// why it is not there rather than simply going missing.
const closedReason = computed<string>(() => {
  if (!props.canJoin) return t('public.tournaments.details.signInToJoin')
  if (isFull.value) return t('public.tournaments.full')
  return t('public.tournaments.closed')
})

const spotsNote = computed<string>(() =>
  isFull.value
    ? t('public.tournaments.details.rosterFull', {
        count: props.tournament?.maxParticipants ?? 0,
      })
    : t('public.tournaments.details.spotsLeft', {
        count: slotsLeft.value,
        total: props.tournament?.maxParticipants ?? 0,
      }),
)

const pendingCount = computed<number>(() => roster.value?.stagedCount ?? 0)

const isSubmitting = computed<boolean>(
  () => roster.value?.isSubmitting ?? false,
)

// Opened from the join button, the info above it is context rather than the
// point — so the form is brought into view instead of making the user scroll.
watch(
  () => props.open,
  async (open) => {
    if (!open || !props.focusSignUp) return
    await nextTick()
    roster.value?.scrollIntoView()
  },
)
</script>

<template>
  <DialogComponent
    :open="open"
    size="xl"
    :title="tournament?.title"
    :cover="image"
    body-class="p-0"
    @close="emit('close')"
  >
    <!-- Status and format ride on the cover, out of the way of the title -->
    <template #header-badges>
      <template v-if="tournament">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur"
          :class="STATUS_BADGE[tournament.status]"
        >
          <span
            v-if="tournament.status === TournamentStatus.ongoing"
            class="size-1.5 animate-pulse rounded-full bg-current"
          />
          {{ t(`public.tournaments.status.${tournament.status}`) }}
        </span>
        <span
          v-if="image"
          class="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur"
        >
          {{ t(`public.tournaments.format.${tournament.format}`) }}
        </span>
      </template>
    </template>

    <template #header-sub-content>
      <p
        v-if="tournament?.organizer"
        class="mt-1.5 min-w-0 truncate text-sm"
        :class="
          image
            ? 'text-white/80 drop-shadow-sm'
            : 'text-gray-500 dark:text-gray-400'
        "
      >
        {{
          t('public.tournaments.organizedBy', { name: tournament.organizer })
        }}
      </p>
    </template>

    <!-- Details on the left, the roster on the right once there is room for
         both; stacked below lg, where the roster follows the description. -->
    <div v-if="tournament" class="grid lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="flex flex-col gap-6 px-4 py-5 sm:p-6">
        <TournamentDetailsFacts :tournament="tournament" />
        <TournamentDetailsPrizes :tournament="tournament" />
        <TournamentDetailsAbout :tournament="tournament" />
      </div>

      <TournamentDetailsRoster
        ref="roster"
        :tournament="tournament"
        :participants="participants"
        :user="user"
        :can-sign-up="canSignUp"
        :closed-reason="closedReason"
        :active="open"
        @confirm="emit('confirm', $event)"
      />
    </div>

    <template #footer>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ spotsNote }}
        </p>
        <!-- Reversed while stacked so the confirm sits on top, where a thumb
             lands first; side by side it goes back to trailing the cancel. -->
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <CButton variant="secondary" size="lg" @click="emit('close')">
            {{
              canSignUp ? t('common.actions.cancel') : t('common.actions.close')
            }}
          </CButton>
          <CButton
            v-if="canSignUp"
            variant="primary"
            size="lg"
            :disabled="!pendingCount"
            :loading="isSubmitting"
            :loading-text="t('public.tournaments.joinDialog.joining')"
            @click="roster?.submit()"
          >
            {{
              t('public.tournaments.joinDialog.confirm', {
                count: pendingCount,
              })
            }}
          </CButton>
        </div>
      </div>
    </template>
  </DialogComponent>
</template>
