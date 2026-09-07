<script setup lang="ts">
/**
 * Editing in the shape of the public dialog: the same header, the same
 * sections, in the same order, each one swapping to its fields where it sits.
 * Every section saves on its own, so a status change is one field and one
 * request rather than a round trip through the whole record.
 */
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegle } from '@regle/core'
import { minValue, numeric, required } from '@regle/rules'
import { DateTime } from 'luxon'
import { toast } from 'vue-sonner'
import { IconPencil } from '@tabler/icons-vue'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CSelect from '@/components/CSelect.vue'
import CTextArea from '@/components/CTextArea.vue'
import FilePondUploader from '@/components/FilePondUploader.vue'
import TournamentEditSection from './TournamentEditSection.vue'
import TournamentEditRoster from './TournamentEditRoster.vue'
import TournamentDetailsLayout from '@/features/tournaments/components/TournamentDetailsLayout.vue'
import TournamentDetailsFacts from '@/features/tournaments/components/TournamentDetailsFacts.vue'
import TournamentDetailsPrizes from '@/features/tournaments/components/TournamentDetailsPrizes.vue'
import TournamentDetailsAbout from '@/features/tournaments/components/TournamentDetailsAbout.vue'
import type { FilePondUploaderInstance } from '@/components/filePondUploader.model.ts'
import {
  deleteUploadedFiles,
  storagePathFromPublicUrl,
  type UploadedFile,
} from '@/utils/fileUpload'
import {
  type Tournament,
  TournamentFormat,
  TournamentPrizeType,
  TournamentStatus,
  type UpdateTournament,
} from '@/features/tournaments/tournament.model.ts'
import type { TournamentParticipant } from '@/features/tournaments/participant.model.ts'
import { resolveLocalized } from '@/utils/localizedString.ts'
import logger from '@/lib/logger'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import tournamentService from '@/features/tournaments/events/service.ts'
import tournamentParticipantsService from '@/features/tournaments/participants/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

interface Props {
  open: boolean
  tournament: Tournament | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updated: [tournament: Tournament]
  participants: [tournament: Tournament]
}>()

const { t, locale } = useI18n()

const COVER_BUCKET = 'images'
const TOURNAMENT_TYPES = Object.values(TournamentFormat)
const TOURNAMENT_STATUSES = Object.values(TournamentStatus)
const PRIZE_TYPES = Object.values(TournamentPrizeType)

const formatOptions = computed(() =>
  TOURNAMENT_TYPES.map((type) => ({
    value: type,
    label: t(`admin.tournaments.format.${type}`),
  })),
)

const statusOptions = computed(() =>
  TOURNAMENT_STATUSES.map((status) => ({
    value: status,
    label: t(`admin.tournaments.status.${status}`),
  })),
)

type Section = 'header' | 'facts' | 'prizes' | 'about'

// A local copy so a saved section shows immediately, without waiting for the
// list behind the dialog to refetch.
const current = ref<Tournament | null>(null)
const editing = ref<Record<Section, boolean>>({
  header: false,
  facts: false,
  prizes: false,
  about: false,
})
const saving = ref<Section | null>(null)

const participants = ref<TournamentParticipant[]>([])
const isLoadingParticipants = ref<boolean>(false)
const participantsFailed = ref<boolean>(false)

const coverUploader = useTemplateRef<FilePondUploaderInstance>('coverUploader')
const hasNewCover = ref<boolean>(false)
const removeCover = ref<boolean>(false)

const headerDraft = ref<{
  title: string
  organizer: string
  status: TournamentStatus
}>({ title: '', organizer: '', status: TournamentStatus.scheduled })

const factsDraft = ref<{
  startsAt: string
  place: string
  format: TournamentFormat
  maxParticipants: string
}>({
  startsAt: '',
  place: '',
  format: TournamentFormat.singleElimination,
  maxParticipants: '',
})

const prizesDraft = ref<Record<TournamentPrizeType, string>>(
  Object.fromEntries(PRIZE_TYPES.map((prize) => [prize, ''])) as Record<
    TournamentPrizeType,
    string
  >,
)

const aboutDraft = ref<string>('')

const image = computed<string | undefined>(
  () => current.value?.cover || current.value?.thumbnail || undefined,
)

const coverFolder = computed((): string => {
  const tenantId = tenantStore.tenant?.id
  return tenantId
    ? `tenants/${tenantId}/tournaments`
    : 'tenants/default/tournaments'
})

// The cap cannot be pulled below the people already on the roster, and two is
// the floor for a tournament at all.
const minParticipants = computed<number>(() =>
  Math.max(2, current.value?.participants ?? 0),
)

const { r$: headerR$ } = useRegle(headerDraft, {
  title: { required },
  organizer: { required },
})

const { r$: factsR$ } = useRegle(factsDraft, {
  startsAt: { required },
  place: { required },
  maxParticipants: {
    required,
    numeric,
    minValue: minValue(() => minParticipants.value),
  },
})

// `datetime-local` wants a plain local wall-clock string, not an offset.
const toLocalInput = (iso: string): string => {
  const value = DateTime.fromISO(iso)
  return value.isValid ? value.toFormat("yyyy-LL-dd'T'HH:mm") : ''
}

const resetCoverState = (): void => {
  hasNewCover.value = false
  removeCover.value = false
  coverUploader.value?.reset()
}

const openHeaderEdit = (): void => {
  startHeaderEdit()
  editing.value.header = true
}

const startHeaderEdit = (): void => {
  if (!current.value) return
  headerDraft.value = {
    title: current.value.title,
    organizer: current.value.organizer,
    status: current.value.status,
  }
  resetCoverState()
  headerR$.$reset()
}

const startFactsEdit = (): void => {
  if (!current.value) return
  factsDraft.value = {
    startsAt: toLocalInput(current.value.startsAt),
    place: current.value.place,
    format: current.value.format,
    maxParticipants: String(current.value.maxParticipants),
  }
  factsR$.$reset()
}

const startPrizesEdit = (): void => {
  prizesDraft.value = Object.fromEntries(
    PRIZE_TYPES.map((prize) => [
      prize,
      resolveLocalized(current.value?.prizes?.[prize], locale.value),
    ]),
  ) as Record<TournamentPrizeType, string>
}

const startAboutEdit = (): void => {
  aboutDraft.value = current.value?.description ?? ''
}

/**
 * Prizes are stored per language. Editing one only replaces the text for the
 * language being used, so a Portuguese prize is not lost by an admin working
 * in English; clearing the field drops the prize entirely.
 */
const nextPrizes = (): UpdateTournament['prizes'] => {
  const entries = PRIZE_TYPES.flatMap((prize) => {
    const value = prizesDraft.value[prize].trim()
    if (!value) return []

    const existing = current.value?.prizes?.[prize] ?? {}
    return [[prize, { ...existing, [locale.value]: value }]]
  })

  if (!entries.length) return null
  return Object.fromEntries(entries) as UpdateTournament['prizes']
}

const persist = async (
  section: Section,
  patch: UpdateTournament,
): Promise<Tournament | null> => {
  if (!current.value || !tenantStore.tenant || !editionStore.edition)
    return null

  saving.value = section
  try {
    const updated = await tournamentService.update(
      tenantStore.tenant.id,
      editionStore.edition.id,
      current.value.id,
      patch,
    )
    current.value = updated
    editing.value[section] = false
    toast.success(t('admin.tournaments.edit.saveSuccess'))
    emit('updated', updated)
    return updated
  } catch (error) {
    logger.error('Unable to update tournament', {
      section,
      id: current.value.id,
      error,
    })
    toast.error(t('admin.tournaments.edit.saveFailed'))
    return null
  } finally {
    saving.value = null
  }
}

const saveHeader = async (): Promise<void> => {
  if (!current.value) return

  const { valid } = await headerR$.$validate()
  if (!valid) return

  const previousCover = current.value.cover

  // Uploaded only once the rest of the section is known to be good, and only
  // dropped from storage after the row that pointed at it has moved on.
  let uploaded: UploadedFile | undefined
  if (hasNewCover.value && coverUploader.value) {
    saving.value = 'header'
    try {
      ;[uploaded] = await coverUploader.value.upload()
    } finally {
      saving.value = null
    }

    if (!uploaded) {
      toast.error(t('admin.tournaments.form.coverUploadFailed'))
      return
    }
  }

  const patch: UpdateTournament = {
    title: headerDraft.value.title.trim(),
    organizer: headerDraft.value.organizer.trim(),
    status: headerDraft.value.status,
    ...(uploaded ? { cover: uploaded.url } : {}),
    ...(!uploaded && removeCover.value ? { cover: null } : {}),
  }

  const updated = await persist('header', patch)

  if (!updated) {
    // The row still points at the old cover, so the new upload is an orphan.
    if (uploaded) await deleteUploadedFiles([uploaded])
    return
  }

  if (previousCover && previousCover !== updated.cover) {
    await discardCover(previousCover)
  }
  resetCoverState()
}

// Best effort: a cover that cannot be traced back to our bucket is left alone
// rather than guessed at.
const discardCover = async (url: string): Promise<void> => {
  const path = storagePathFromPublicUrl(url, COVER_BUCKET)
  if (!path) return
  await deleteUploadedFiles([{ url, path, bucket: COVER_BUCKET }])
}

const saveFacts = async (): Promise<void> => {
  const { valid } = await factsR$.$validate()
  if (!valid) return

  const startsAt = DateTime.fromISO(factsDraft.value.startsAt)

  await persist('facts', {
    startsAt: startsAt.toISO() ?? '',
    place: factsDraft.value.place.trim(),
    format: factsDraft.value.format,
    maxParticipants: Number(factsDraft.value.maxParticipants),
  })
}

const savePrizes = async (): Promise<void> => {
  await persist('prizes', { prizes: nextPrizes() })
}

const saveAbout = async (): Promise<void> => {
  const description = aboutDraft.value.trim()
  await persist('about', { description: description || null })
}

async function loadParticipants(): Promise<void> {
  if (!current.value || !tenantStore.tenant || !editionStore.edition) return

  isLoadingParticipants.value = true
  participantsFailed.value = false

  try {
    participants.value = await tournamentParticipantsService.getAllByTournament(
      tenantStore.tenant.id,
      editionStore.edition.id,
      current.value.id,
    )
  } catch (error) {
    participantsFailed.value = true
    participants.value = []
    logger.error('Failed to load tournament participants', {
      tournamentId: current.value.id,
      error,
    })
  } finally {
    isLoadingParticipants.value = false
  }
}

// Every open starts clean: sign-ups land while the admin is on this page, and
// a section left open from last time would be editing stale values.
watch(
  () => props.open,
  async (open) => {
    if (!open) return

    current.value = props.tournament ? { ...props.tournament } : null
    editing.value = {
      header: false,
      facts: false,
      prizes: false,
      about: false,
    }
    saving.value = null
    participants.value = []
    resetCoverState()

    await loadParticipants()
  },
  // Immediate, so a dialog that is mounted already open still gets seeded.
  { immediate: true },
)
</script>

<template>
  <DialogComponent
    :open="open"
    size="xl"
    :title="t('admin.tournaments.edit.title')"
    body-class="p-0"
    @close="emit('close')"
  >
    <TournamentDetailsLayout v-if="current" :tournament="current">
      <!-- The header steps aside only for its own fields; the rest of the time
           the shared block renders it and simply takes the pencil. -->
      <template v-if="editing.header" #header>
        <div
          class="border-b border-gray-100 px-4 py-5 sm:p-6 dark:border-white/10"
        >
          <div class="space-y-5">
            <div>
              <label
                class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
              >
                {{ t('admin.tournaments.form.cover') }}
              </label>

              <!-- What is on the record already, until it is replaced or dropped -->
              <div
                v-if="image && !removeCover"
                class="mt-2 flex items-center gap-3"
              >
                <img
                  :src="image"
                  alt=""
                  class="h-16 w-28 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-white/10"
                />
                <button
                  type="button"
                  class="cursor-pointer text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                  @click="removeCover = true"
                >
                  {{ t('admin.tournaments.edit.removeCover') }}
                </button>
              </div>
              <p
                v-else-if="image"
                class="mt-2 text-sm text-gray-500 dark:text-gray-400"
              >
                {{ t('admin.tournaments.edit.coverWillBeRemoved') }}
                <button
                  type="button"
                  class="cursor-pointer font-medium text-primary-600 hover:underline dark:text-primary-400"
                  @click="removeCover = false"
                >
                  {{ t('admin.tournaments.edit.keepCover') }}
                </button>
              </p>

              <FilePondUploader
                ref="coverUploader"
                class="mt-3"
                :allow-multiple="false"
                :accepted-file-types="[
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'image/webp',
                ]"
                max-file-size="10MB"
                :max-files="1"
                :label-idle="t('admin.tournaments.form.coverLabelIdle')"
                supabase-bucket="images"
                :supabase-path="coverFolder"
                file-naming-strategy="uuid"
                :supabase-options="{ cacheControl: '31536000', upsert: false }"
                @update:has-files="hasNewCover = $event"
              />
            </div>

            <CInput
              id="edit-tournament-title"
              v-model="headerDraft.title"
              :label="t('admin.tournaments.form.title')"
              :errors="headerR$.$errors.title"
            />

            <CInput
              id="edit-tournament-organizer"
              v-model="headerDraft.organizer"
              :label="t('admin.tournaments.form.organizer')"
              :errors="headerR$.$errors.organizer"
            />

            <CSelect
              id="edit-tournament-status"
              v-model="headerDraft.status"
              :label="t('admin.tournaments.edit.status')"
              :items="statusOptions"
            />
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <CButton
              variant="secondary"
              size="sm"
              :disabled="saving === 'header'"
              @click="editing.header = false"
            >
              {{ t('common.actions.cancel') }}
            </CButton>
            <CButton
              variant="primary"
              size="sm"
              :loading="saving === 'header'"
              :loading-text="t('common.actions.updating')"
              @click="saveHeader"
            >
              {{ t('common.actions.save') }}
            </CButton>
          </div>
        </div>
      </template>

      <template #header-actions="{ onCover }">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
          :class="
            onCover
              ? 'bg-black/40 text-white backdrop-blur hover:bg-black/60'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
          "
          @click="openHeaderEdit"
        >
          <IconPencil class="size-3.5" aria-hidden="true" />
          {{ t('common.actions.edit') }}
        </button>
      </template>

      <template #facts>
        <TournamentEditSection
          v-model:editing="editing.facts"
          :title="t('admin.tournaments.form.sections.facts')"
          :saving="saving === 'facts'"
          @edit="startFactsEdit"
          @save="saveFacts"
        >
          <template #display>
            <TournamentDetailsFacts :tournament="current" />
          </template>

          <template #edit>
            <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <CInput
                id="edit-tournament-starts-at"
                v-model="factsDraft.startsAt"
                type="datetime-local"
                :label="t('admin.tournaments.form.startsAt')"
                :errors="factsR$.$errors.startsAt"
                class="col-span-full sm:col-span-1"
              />

              <CInput
                id="edit-tournament-place"
                v-model="factsDraft.place"
                :label="t('admin.tournaments.form.place')"
                :errors="factsR$.$errors.place"
                class="col-span-full sm:col-span-1"
              />

              <CSelect
                id="edit-tournament-type"
                v-model="factsDraft.format"
                :label="t('admin.tournaments.form.type')"
                :items="formatOptions"
                class="col-span-full sm:col-span-1"
              />

              <CInput
                id="edit-tournament-max-participants"
                v-model="factsDraft.maxParticipants"
                type="number"
                :min="String(minParticipants)"
                :label="t('admin.tournaments.form.maxParticipants')"
                :errors="factsR$.$errors.maxParticipants"
                :helper-text="
                  current.participants
                    ? t('admin.tournaments.edit.minParticipants', {
                        count: current.participants,
                      })
                    : undefined
                "
                class="col-span-full sm:col-span-1"
              />
            </div>
          </template>
        </TournamentEditSection>
      </template>

      <template #prizes>
        <TournamentEditSection
          v-model:editing="editing.prizes"
          :title="t('public.tournaments.details.prizes')"
          :saving="saving === 'prizes'"
          @edit="startPrizesEdit"
          @save="savePrizes"
        >
          <template #display>
            <TournamentDetailsPrizes :tournament="current" bare />
            <p
              v-if="!current.prizes"
              class="text-sm text-gray-400 dark:text-gray-500"
            >
              {{ t('admin.tournaments.edit.noPrizes') }}
            </p>
          </template>

          <template #edit>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <CInput
                v-for="prize in PRIZE_TYPES"
                :id="`edit-tournament-prize-${prize}`"
                :key="prize"
                v-model="prizesDraft[prize]"
                :label="t(`admin.tournaments.prize.${prize}`)"
                class="col-span-full sm:col-span-1"
              />
            </div>
          </template>
        </TournamentEditSection>
      </template>

      <template #about>
        <TournamentEditSection
          v-model:editing="editing.about"
          :title="t('public.tournaments.details.about')"
          :saving="saving === 'about'"
          @edit="startAboutEdit"
          @save="saveAbout"
        >
          <template #display>
            <TournamentDetailsAbout :tournament="current" bare />
            <p
              v-if="!current.description?.trim()"
              class="text-sm text-gray-400 dark:text-gray-500"
            >
              {{ t('admin.tournaments.edit.noDescription') }}
            </p>
          </template>

          <template #edit>
            <CTextArea
              id="edit-tournament-description"
              v-model="aboutDraft"
              :label="t('admin.tournaments.form.description')"
              :rows="4"
            />
          </template>
        </TournamentEditSection>
      </template>

      <template #aside>
        <TournamentEditRoster
          :tournament="current"
          :participants="participants"
          :loading="isLoadingParticipants"
          :failed="participantsFailed"
          @manage="emit('participants', current)"
        />
      </template>
    </TournamentDetailsLayout>

    <template #footer>
      <div class="flex justify-end">
        <CButton variant="secondary" size="lg" @click="emit('close')">
          {{ t('common.actions.close') }}
        </CButton>
      </div>
    </template>
  </DialogComponent>
</template>
