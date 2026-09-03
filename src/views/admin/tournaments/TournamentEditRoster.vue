<script setup lang="ts">
/**
 * The roster column of the details layout, in its admin form: who is signed
 * up, read-only, with the way through to the full table. The 340px column has
 * no room for four sortable columns, so the depth stays in its own dialog.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconUsers } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TournamentRosterMeter from '@/features/tournaments/components/TournamentRosterMeter.vue'
import TournamentParticipantRow from '@/features/tournaments/components/TournamentParticipantRow.vue'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import {
  participantDisplayName,
  participantEmail,
  participantInitials,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'

interface Props {
  tournament: Tournament
  participants: TournamentParticipant[]
  loading?: boolean
  failed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  failed: false,
})

const emit = defineEmits<{
  manage: []
}>()

const { t } = useI18n()

interface RosterEntry {
  id: string
  name: string
  initials: string
  detail: string
  fromTicket: boolean
}

const entries = computed<RosterEntry[]>(() =>
  props.participants.map((participant) => {
    const name =
      participantDisplayName(participant) ||
      t('admin.tournaments.participantsDialog.unnamed')

    return {
      id: participant.id,
      name,
      initials: participantInitials(name),
      detail: participantEmail(participant),
      fromTicket: !!participant.ticketIssuanceId,
    }
  }),
)
</script>

<template>
  <section
    class="border-t border-gray-100 bg-gray-50/70 px-4 py-5 sm:p-6 lg:border-t-0 lg:border-l dark:border-white/10 dark:bg-white/[0.03]"
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

    <div v-if="loading" class="mt-4 flex flex-col gap-1.5">
      <SkeletonLoader
        v-for="index in 4"
        :key="index"
        class-name="h-12 w-full"
        rounded="lg"
      />
    </div>

    <!-- The list is capped so a long roster does not push the button out of
         reach at the bottom of an already tall dialog. -->
    <ul
      v-else-if="entries.length"
      class="mt-4 flex max-h-72 flex-col gap-1.5 overflow-y-auto"
    >
      <TournamentParticipantRow
        v-for="entry in entries"
        :key="entry.id"
        :name="entry.name"
        :initials="entry.initials"
        :detail="entry.detail"
        :from-ticket="entry.fromTicket"
      />
    </ul>

    <div v-else class="mt-4 rounded-xl px-3 py-8 text-center">
      <div
        class="mx-auto flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5"
      >
        <IconUsers class="size-5 text-gray-400" aria-hidden="true" />
      </div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{
          failed
            ? t('admin.tournaments.participantsDialog.loadFailed')
            : t('admin.tournaments.participantsDialog.empty')
        }}
      </p>
    </div>

    <CButton
      variant="secondary"
      size="sm"
      full-width
      class="mt-4"
      @click="emit('manage')"
    >
      {{ t('admin.tournaments.edit.manageParticipants') }}
    </CButton>
  </section>
</template>
