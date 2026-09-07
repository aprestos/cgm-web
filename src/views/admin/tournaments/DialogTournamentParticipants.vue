<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { toast } from 'vue-sonner'
import { useRegle } from '@regle/core'
import { email as emailRule, minLength, required } from '@regle/rules'
import {
  IconPlus,
  IconSearch,
  IconTicket,
  IconTrash,
  IconUserPlus,
  IconUsers,
  IconX,
} from '@tabler/icons-vue'
import DialogComponent from '@/components/DialogComponent.vue'
import type { DataTableColumn } from '@/components/DataTable.vue'
import DataTable from '@/components/DataTable.vue'
import CAvatar from '@/components/CAvatar.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CInfoPopover from '@/components/CInfoPopover.vue'
import FormTabs, { type TabConfig } from '@/components/FormTabs.vue'
import CCombobox from '@/components/CCombobox.vue'
import type { Option } from '@/components/select.types'
import logger from '@/lib/logger.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import { type User, userService } from '@/features/users/service.ts'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'
import {
  type CreateTournamentParticipant,
  participantDisplayName,
  participantEmail,
  participantInitials,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import tournamentParticipantsService from '@/features/tournaments/participants/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

/** Flattened for the table: sorting and searching both work off these fields. */
interface ParticipantRow {
  id: string
  name: string
  email: string
  joinedAt: string
  joinedLabel: string
  signedUpBy: string
  initials: string
  fromTicket: boolean
}

const props = defineProps<{
  open: boolean
  tournament: Tournament | null
}>()

const emit = defineEmits<{
  close: []
  /** The roster changed, so counts elsewhere are stale */
  updated: []
}>()

const { t, locale } = useI18n()

const participants = ref<TournamentParticipant[]>([])
const isLoading = ref<boolean>(false)
const hasFailed = ref<boolean>(false)
const searchQuery = ref<string>('')

// Adding
const isAddOpen = ref<boolean>(false)
const addTab = ref<number>(0)
const selectedUserId = ref<string | null>(null)
const isAdding = ref<boolean>(false)
// The combobox hands back an id, but a sign-up is stored by name and email —
// so the accounts behind the last results are kept around to look them up.
const searchedUsers = new Map<string, User>()
const manualForm = ref({ name: '', email: '' })

const EMPTY_VALUE = '—'
const SEARCH_TAB = 0

const { r$: manualR$ } = useRegle(manualForm, {
  name: { required, minLength: minLength(2) },
  email: { required, email: emailRule },
})

const rows = computed<ParticipantRow[]>(() =>
  participants.value.map((participant) => {
    const name =
      participantDisplayName(participant) ||
      t('admin.tournaments.participantsDialog.unnamed')

    return {
      id: participant.id,
      name,
      email: participantEmail(participant),
      joinedAt: participant.createdAt,
      joinedLabel: DateTime.fromISO(participant.createdAt)
        .setLocale(locale.value)
        .toLocaleString(DateTime.DATETIME_MED),
      // The account behind the sign-up, which is not always the participant.
      signedUpBy: participant.user?.name || participant.user?.email || '',
      initials: participantInitials(name),
      fromTicket: !!participant.ticketIssuanceId,
    }
  }),
)

const filteredRows = computed<ParticipantRow[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return rows.value

  return rows.value.filter(
    (row) =>
      row.name.toLowerCase().includes(query) ||
      row.email.toLowerCase().includes(query),
  )
})

// The public sign-up honours maxParticipants, so the admin side holds the same
// line rather than quietly overbooking a tournament.
const isFull = computed<boolean>(
  () =>
    !!props.tournament &&
    participants.value.length >= props.tournament.maxParticipants,
)

const addTabs = computed<TabConfig[]>(() => [
  {
    label: t('admin.tournaments.participantsDialog.add.tabSearch'),
    icon: IconSearch,
  },
  {
    label: t('admin.tournaments.participantsDialog.add.tabManual'),
    icon: IconUserPlus,
  },
])

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

async function searchUsers(query: string): Promise<Option<string>[]> {
  const results = await userService.search(query)

  return results.map((user) => {
    searchedUsers.set(user.id, user)
    return {
      value: user.id,
      label: user.name || user.email,
      secondaryLabel: user.email ? `(${user.email})` : undefined,
    }
  })
}

function resetAddForm(): void {
  selectedUserId.value = null
  manualForm.value = { name: '', email: '' }
  manualR$.$reset()
}

function closeAddPanel(): void {
  isAddOpen.value = false
  resetAddForm()
}

/**
 * Pulls the sign-up out of whichever tab is open. `null` means the tab is not
 * ready to submit — the manual form reports its own errors in that case.
 */
async function buildParticipant(): Promise<CreateTournamentParticipant | null> {
  if (addTab.value === SEARCH_TAB) {
    const user = selectedUserId.value
      ? searchedUsers.get(selectedUserId.value)
      : undefined
    if (!user) return null

    return {
      participantName: user.name || user.email,
      participantEmail: user.email,
    }
  }

  const { valid, data } = await manualR$.$validate()
  if (!valid) return null

  return {
    participantName: data.name.trim(),
    participantEmail: data.email.trim(),
  }
}

async function addParticipant(): Promise<void> {
  if (isAdding.value || isFull.value) return
  if (!props.tournament || !tenantStore.tenant || !editionStore.edition) return

  const participant = await buildParticipant()
  if (!participant) return

  // The roster is the only place a duplicate shows up, and re-adding someone
  // would burn a spot twice.
  const address = participant.participantEmail?.toLowerCase()
  if (
    address &&
    rows.value.some((row) => row.email.toLowerCase() === address)
  ) {
    toast.error(
      t('admin.tournaments.participantsDialog.add.duplicate', {
        name: participant.participantName ?? address,
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
      [participant],
    )
  } catch (error) {
    logger.error('Failed to add a tournament participant', {
      tournamentId: props.tournament.id,
      error,
    })
    toast.error(t('admin.tournaments.participantsDialog.add.failed'))
    return
  } finally {
    isAdding.value = false
  }

  toast.success(
    t('admin.tournaments.participantsDialog.add.success', {
      name: participant.participantName ?? '',
    }),
  )

  // The panel stays open: admins tend to add a handful in one sitting.
  resetAddForm()
  await loadParticipants()
  emit('updated')
}

// Reloading on every open keeps the roster honest — sign-ups land while the
// admin is on this page.
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    searchQuery.value = ''
    participants.value = []
    addTab.value = SEARCH_TAB
    closeAddPanel()
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
      <!-- Add participant — collapsed to a single button until it is needed,
           so the roster keeps the room -->
      <div class="px-4 pt-4 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <CButton
            v-if="!isAddOpen"
            variant="secondary"
            size="sm"
            :disabled="isFull"
            @click="isAddOpen = true"
          >
            <IconPlus class="mr-1.5 size-4" />
            {{ t('admin.tournaments.participantsDialog.add.open') }}
          </CButton>
          <template v-else>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ t('admin.tournaments.participantsDialog.add.title') }}
            </p>
            <button
              type="button"
              class="cursor-pointer rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              :aria-label="t('admin.tournaments.participantsDialog.add.cancel')"
              @click="closeAddPanel"
            >
              <IconX class="size-5" />
            </button>
          </template>
        </div>

        <p
          v-if="isFull"
          class="mt-2 text-xs text-amber-600 dark:text-amber-400"
        >
          {{ t('admin.tournaments.participantsDialog.add.full') }}
        </p>

        <FormTabs v-if="isAddOpen" v-model="addTab" :tabs="addTabs">
          <!-- Tab 0: an account that already exists -->
          <template #tab-0>
            <div class="space-y-4">
              <CCombobox
                id="participant-user"
                v-model="selectedUserId"
                :label="t('admin.tournaments.participantsDialog.add.userLabel')"
                :placeholder="
                  t('admin.tournaments.participantsDialog.add.userPlaceholder')
                "
                :search-fn="searchUsers"
              />
              <div class="flex justify-end">
                <CButton
                  size="sm"
                  :disabled="!selectedUserId || isFull"
                  :loading="isAdding"
                  :loading-text="
                    t('admin.tournaments.participantsDialog.add.submitting')
                  "
                  @click="addParticipant"
                >
                  {{ t('admin.tournaments.participantsDialog.add.submit') }}
                </CButton>
              </div>
            </div>
          </template>

          <!-- Tab 1: a walk-in with no account behind them -->
          <template #tab-1>
            <div class="space-y-4">
              <CInput
                id="participant-name"
                v-model="manualForm.name"
                :label="t('admin.tournaments.participantsDialog.add.nameLabel')"
                :placeholder="
                  t('admin.tournaments.participantsDialog.add.namePlaceholder')
                "
                :errors="manualR$.$errors.name"
              />
              <CInput
                id="participant-email"
                v-model="manualForm.email"
                type="email"
                :label="
                  t('admin.tournaments.participantsDialog.add.emailLabel')
                "
                :placeholder="
                  t('admin.tournaments.participantsDialog.add.emailPlaceholder')
                "
                :errors="manualR$.$errors.email"
              />
              <div class="flex justify-end">
                <CButton
                  size="sm"
                  :disabled="isFull"
                  :loading="isAdding"
                  :loading-text="
                    t('admin.tournaments.participantsDialog.add.submitting')
                  "
                  @click="addParticipant"
                >
                  {{ t('admin.tournaments.participantsDialog.add.submit') }}
                </CButton>
              </div>
            </div>
          </template>
        </FormTabs>
      </div>

      <!-- Search -->
      <div class="px-4 py-4 sm:px-6">
        <label for="participant-search" class="sr-only">
          {{ t('admin.tournaments.participantsDialog.searchLabel') }}
        </label>
        <div class="relative">
          <div
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <IconSearch class="size-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="participant-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="
              t('admin.tournaments.participantsDialog.searchPlaceholder')
            "
            class="block w-full rounded-md bg-white py-1.5 pl-10 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-primary-500"
          />
        </div>
      </div>

      <!-- Roster — capped so the search field stays put on long lists -->
      <div
        class="max-h-[60vh] overflow-y-auto border-t border-gray-100 dark:border-white/10"
      >
        <DataTable
          v-if="isLoading || filteredRows.length"
          :items="filteredRows"
          :columns="columns"
          :loading="isLoading"
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
            {{
              hasFailed
                ? t('admin.tournaments.participantsDialog.loadFailed')
                : searchQuery
                  ? t('admin.tournaments.participantsDialog.noMatches', {
                      query: searchQuery,
                    })
                  : t('admin.tournaments.participantsDialog.empty')
            }}
          </p>
        </div>
      </div>
    </div>
  </DialogComponent>
</template>

<style scoped></style>
