<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { IconTicket, IconTrash, IconUsers } from '@tabler/icons-vue'
import type { DataTableColumn } from '@/components/DataTable.vue'
import DataTable from '@/components/DataTable.vue'
import CAvatar from '@/components/CAvatar.vue'
import CInfoPopover from '@/components/CInfoPopover.vue'
import {
  matchesQuery,
  type ParticipantRow,
  toParticipantRow,
} from './participantRow.model.ts'
import type { TournamentParticipant } from '@/features/tournaments/participant.model.ts'
import type { Tournament } from '~/features/tournaments/tournament.model.ts'

interface Props {
  participants: TournamentParticipant[]
  tournament: Tournament | null
  loading: boolean
  /** The roster could not be loaded, as opposed to being empty */
  failed: boolean
  searchQuery: string
}

const props = defineProps<Props>()

const { t, locale } = useI18n()

const EMPTY_VALUE = '—'

const rows = computed<ParticipantRow[]>(() =>
  props.participants.map((participant) =>
    toParticipantRow(
      participant,
      locale.value,
      t('admin.tournaments.participantsDialog.unnamed'),
    ),
  ),
)

const filteredRows = computed<ParticipantRow[]>(() => {
  const query = props.searchQuery.trim().toLowerCase()
  if (!query) return rows.value

  return rows.value.filter((row) => matchesQuery(row, query))
})

const columns = computed<DataTableColumn<ParticipantRow>[]>(() => [
  {
    key: 'name',
    label: t('admin.tournaments.participantsDialog.participant'),
    cellClass: 'text-gray-900 dark:text-white',
    sortable: true,
  },
  {
    key: 'email',
    label: t('admin.tournaments.participantsDialog.email'),
    breakpoint: 'sm',
    sortable: true,
  },
  {
    key: 'joinedAt',
    label: t('admin.tournaments.participantsDialog.joined'),
    cellClass: 'whitespace-nowrap text-gray-500 dark:text-gray-400',
    breakpoint: 'md',
    sortable: true,
    // Annotated because types coming out of a .vue import widen to `any`
    sortFn: (a: ParticipantRow, b: ParticipantRow): number =>
      DateTime.fromISO(a.joinedAt).toMillis() -
      DateTime.fromISO(b.joinedAt).toMillis(),
  },
  {
    key: 'signedUpBy',
    label: t('admin.tournaments.participantsDialog.signedUpBy'),
    breakpoint: 'md',
    sortable: true,
  },
])

// A failed load, an empty roster and a search miss all land on the same block,
// so only the sentence changes between them.
const emptyMessage = computed<string>(() => {
  if (props.failed) return t('admin.tournaments.participantsDialog.loadFailed')
  if (props.searchQuery)
    return t('admin.tournaments.participantsDialog.noMatches', {
      query: props.searchQuery,
    })

  return t('admin.tournaments.participantsDialog.empty')
})
</script>

<template>
  <!-- Roster — capped so the search field stays put on long lists -->
  <div
    class="max-h-[60vh] overflow-y-auto border-t border-gray-100 dark:border-white/10"
  >
    <DataTable
      v-if="loading || filteredRows.length"
      :items="filteredRows"
      :columns="columns"
      :loading="loading"
      :count="props.tournament?.participants"
      row-key="id"
    >
      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <CAvatar
            size="sm"
            shape="circle"
            :initials="item.initials"
            :alt="item.name"
            class="shrink-0"
          />
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="truncate font-medium">{{ item.name }}</span>
              <IconTicket
                v-if="item.fromTicket"
                class="size-4 shrink-0 text-primary-500"
                :aria-label="
                  t('admin.tournaments.participantsDialog.fromTicket')
                "
              />
            </div>
            <!-- The columns below drop off on narrow screens, so the same
                 facts ride along under the name there -->
            <p
              v-if="item.email"
              class="truncate text-xs text-gray-500 sm:hidden dark:text-gray-400"
            >
              {{ item.email }}
            </p>
            <p class="text-xs text-gray-500 md:hidden dark:text-gray-400">
              {{ item.joinedLabel }}
              <template v-if="item.signedUpBy">
                ·
                {{
                  t('admin.tournaments.participantsDialog.byUser', {
                    name: item.signedUpBy,
                  })
                }}
              </template>
            </p>
          </div>
        </div>
      </template>

      <template #cell-email="{ item }">
        <a
          v-if="item.email"
          :href="`mailto:${item.email}`"
          class="truncate text-primary-600 hover:underline dark:text-primary-400"
        >
          {{ item.email }}
        </a>
        <span v-else>{{ EMPTY_VALUE }}</span>
      </template>

      <template #cell-joinedAt="{ item }">
        {{ item.joinedLabel }}
      </template>

      <template #cell-signedUpBy="{ item }">
        {{ item.signedUpBy || EMPTY_VALUE }}
      </template>

      <!-- Removing a row also has to free the spot on the tournament
           participant count, so the action only owns up to that for now. -->
      <template #actions="{ item }">
        <CInfoPopover
          class="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          :aria-label="
            t('admin.tournaments.participantsDialog.remove.action', {
              name: item.name,
            })
          "
        >
          <IconTrash class="size-4" />
        </CInfoPopover>
      </template>
    </DataTable>

    <!-- Nothing to show: a failed load, an empty roster, or a search miss -->
    <div v-else class="px-4 py-12 text-center sm:px-6">
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5"
      >
        <IconUsers class="size-6 text-gray-400" />
      </div>
      <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">
        {{ emptyMessage }}
      </p>
    </div>
  </div>
</template>
