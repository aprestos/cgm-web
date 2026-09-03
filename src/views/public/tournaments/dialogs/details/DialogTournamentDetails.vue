<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import TournamentDetailsLayout from '@/features/tournaments/components/TournamentDetailsLayout.vue'
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

const roster = useTemplateRef<TournamentDetailsRosterInstance>('roster')

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

const pendingCount = computed<number>(() => roster.value?.stagedCount ?? 0)

// Nothing on the roster is stored until confirm, so the footer says out loud
// how much is still only staged — right next to the spots it would take up.
const pendingNote = computed<string>(() => {
  if (!pendingCount.value) return ''

  return pendingCount.value === 1
    ? t('public.tournaments.details.pendingSignUp')
    : t('public.tournaments.details.pendingSignUpPlural', {
        count: pendingCount.value,
      })
})

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
    hide-header
    body-class="p-0"
    @close="emit('close')"
  >
    <!-- The layout runs to the panel edge, so it is the one that has to
         follow the panel's rounded top corner behind the cover art. -->
    <TournamentDetailsLayout
      v-if="tournament"
      :tournament="tournament"
      class="overflow-hidden rounded-t-2xl"
    >
      <template #aside>
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
      </template>
    </TournamentDetailsLayout>

    <template #footer>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-sm">
          <p
            v-if="pendingNote"
            class="mt-0.5 flex items-center gap-2 text-gray-500 dark:text-gray-400"
          >
            <span class="size-1.5 shrink-0 rounded-full bg-amber-500" />
            {{ pendingNote }}
          </p>
        </div>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
