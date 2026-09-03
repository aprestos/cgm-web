<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import TournamentSignUpForm from './TournamentSignUpForm.vue'
import TournamentParticipantRow from '@/features/tournaments/components/TournamentParticipantRow.vue'
import TournamentRosterMeter from '@/features/tournaments/components/TournamentRosterMeter.vue'
import type { TournamentSignUpFormInstance } from './tournamentSignUpForm.model.ts'
import type { TournamentDetailsRosterInstance } from './tournamentDetailsRoster.model.ts'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import {
  type CreateTournamentParticipant,
  participantDisplayName,
  participantInitials,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import type { User } from '@/features/auth/user.model.ts'

interface Props {
  tournament: Tournament
  /** The people the current user already signed up for this tournament */
  participants: TournamentParticipant[]
  user: User | null
  /** Whether the sign-up form is offered at all */
  canSignUp: boolean
  /** Shown in place of the form — why signing up is not on the table */
  closedReason: string
  /** Flipped on while the dialog is open, so the form starts from a clean sheet */
  active: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [participants: CreateTournamentParticipant[]]
}>()

const { t } = useI18n()

const root = useTemplateRef<HTMLElement>('root')
const signUpForm = useTemplateRef<TournamentSignUpFormInstance>('signUpForm')

const signedUp = computed<
  { id: string; name: string; initials: string; fromTicket: boolean }[]
>(() =>
  props.participants.map((participant) => {
    const name =
      participantDisplayName(participant) ||
      t('public.tournaments.unnamedParticipant')

    return {
      id: participant.id,
      name,
      initials: participantInitials(name),
      fromTicket: !!participant.ticketIssuanceId,
    }
  }),
)

const stagedCount = computed<number>(() => signUpForm.value?.stagedCount ?? 0)

const isSubmitting = computed<boolean>(
  () => signUpForm.value?.isSubmitting ?? false,
)

const submit = (): void => signUpForm.value?.submit()

// `nearest` covers both scroll containers: the dialog panel itself on phones,
// the backdrop wrapper from sm: up, where the panel stops clipping.
const scrollIntoView = (): void =>
  root.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

defineExpose<TournamentDetailsRosterInstance>({
  submit,
  scrollIntoView,
  get isSubmitting() {
    return isSubmitting.value
  },
  get stagedCount() {
    return stagedCount.value
  },
})
</script>

<template>
  <section
    ref="root"
    class="border-t border-gray-100 bg-gray-50/70 px-4 py-5 sm:p-6 lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-white/[0.03]"
  >
    <div class="flex items-baseline justify-between gap-3">
      <h4
        class="font-display text-base font-semibold text-gray-900 dark:text-white"
      >
        {{ t('public.tournaments.joinDialog.participants') }}
      </h4>
      <span class="text-sm tabular-nums text-gray-500 dark:text-gray-400">
        {{ tournament.participants }} / {{ tournament.maxParticipants }}
      </span>
    </div>

    <TournamentRosterMeter
      class="mt-3"
      :participants="tournament.participants"
      :max-participants="tournament.maxParticipants"
    />

    <div class="mt-4">
      <TournamentSignUpForm
        v-if="canSignUp"
        ref="signUpForm"
        :tournament="tournament"
        :user="user"
        :active="active"
        :existing="signedUp"
        @confirm="emit('confirm', $event)"
      />

      <template v-else>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ closedReason }}
        </p>
        <ul v-if="signedUp.length" class="mt-3 flex flex-col gap-1.5">
          <TournamentParticipantRow
            v-for="participant in signedUp"
            :key="participant.id"
            :name="participant.name"
            :initials="participant.initials"
            :from-ticket="participant.fromTicket"
            :detail="t('public.tournaments.joinDialog.alreadySignedUp')"
          />
        </ul>
      </template>
    </div>
  </section>
</template>
