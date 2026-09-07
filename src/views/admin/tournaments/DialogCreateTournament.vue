<template>
  <DialogComponent
    :open="open"
    :title="t('admin.tournaments.createTournament')"
    size="2xl"
    body-class="p-0"
    @close="emit('close')"
  >
    <!-- Side by side there is nothing to switch between; it is only once the
         preview drops below the form that it needs a way back up. -->
    <div
      class="border-b border-gray-100 px-4 sm:px-6 lg:hidden dark:border-white/10"
    >
      <nav class="-mb-px flex gap-6" role="tablist">
        <button
          v-for="pane in PANES"
          :key="pane"
          type="button"
          role="tab"
          :aria-selected="activePane === pane"
          :aria-controls="`tournament-pane-${pane}`"
          class="cursor-pointer border-b-2 py-3 text-sm font-medium transition-colors"
          :class="
            activePane === pane
              ? 'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
          @click="activePane = pane"
        >
          {{ t(`admin.tournaments.form.tabs.${pane}`) }}
        </button>
      </nav>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_380px]">
      <!-- Fields run in the order the public dialog renders them: cover,
           title and organizer, the facts grid, prizes, then the description. -->
      <form
        id="tournament-pane-edit"
        :class="[
          'px-4 py-5 sm:p-6 lg:block',
          activePane === 'edit' ? 'block' : 'hidden',
        ]"
        @submit.prevent="submit"
      >
        <TournamentFormSection
          :title="t('admin.tournaments.form.sections.cover')"
          optional
        >
          <FilePondUploader
            ref="coverUploader"
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
            @update:has-files="onCoverChange"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.tournaments.form.coverHint') }}
          </p>
        </TournamentFormSection>

        <TournamentFormSection>
          <div class="space-y-5">
            <CInput
              id="tournament-title"
              v-model="formData.title"
              placeholder="Tournament A"
              :label="t('admin.tournaments.form.title')"
              :errors="r$.$errors.title"
            />

            <CInput
              id="tournament-organizer"
              v-model="formData.organizer"
              placeholder="Riverside country club"
              :label="t('admin.tournaments.form.organizer')"
              :errors="r$.$errors.organizer"
            />
          </div>
        </TournamentFormSection>

        <TournamentFormSection>
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <CInput
              id="tournament-starts-at"
              v-model="formData.startsAt"
              type="datetime-local"
              :label="t('admin.tournaments.form.startsAt')"
              :errors="r$.$errors.startsAt"
              class="col-span-full sm:col-span-1"
            />

            <CInput
              id="tournament-place"
              v-model="formData.place"
              :label="t('admin.tournaments.form.place')"
              :errors="r$.$errors.place"
              class="col-span-full sm:col-span-1"
            />

            <!-- Tournament type -->
            <CSelect
              id="tournament-type"
              v-model="formData.format"
              :label="t('admin.tournaments.form.type')"
              :items="formatOptions"
              class="col-span-full sm:col-span-1"
            />

            <CInput
              id="tournament-max-participants"
              v-model="formData.maxParticipants"
              type="number"
              min="2"
              :label="t('admin.tournaments.form.maxParticipants')"
              :errors="r$.$errors.maxParticipants"
              class="col-span-full sm:col-span-1"
            />
          </div>
        </TournamentFormSection>

        <!-- Optional, and rarely filled — folded away, but in the place the
             public dialog gives it rather than tacked on at the end. -->
        <TournamentFormSection
          :title="t('admin.tournaments.form.sections.prizes')"
          optional
          collapsible
        >
          <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <CInput
              v-for="prize in PRIZE_TYPES"
              :id="`tournament-prize-${prize}`"
              :key="prize"
              v-model="formData.prizes[prize]"
              :label="t(`admin.tournaments.prize.${prize}`)"
              class="col-span-full sm:col-span-1"
            />
          </div>
        </TournamentFormSection>

        <TournamentFormSection>
          <CTextArea
            id="tournament-description"
            v-model="formData.description"
            :label="t('admin.tournaments.form.description')"
            :rows="3"
          />
        </TournamentFormSection>
      </form>

      <aside
        id="tournament-pane-preview"
        :class="[
          'border-t border-gray-100 bg-gray-50 px-4 py-5 sm:p-6 lg:block lg:border-t-0 lg:border-l dark:border-white/10 dark:bg-white/[0.02]',
          activePane === 'preview' ? 'block' : 'hidden',
        ]"
      >
        <div class="lg:sticky lg:top-4">
          <h4
            class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {{ t('admin.tournaments.preview.title') }}
          </h4>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.tournaments.preview.hint') }}
          </p>

          <TournamentPreview
            class="mt-4"
            :tournament="draft"
            :cover="coverPreview"
          />
        </div>
      </aside>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 w-full sm:order-1 sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.actions.cancel') }}
        </CButton>
        <CButton
          type="button"
          variant="primary"
          size="lg"
          class="order-1 w-full sm:order-2 sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('common.actions.submitting')"
          @click="submit"
        >
          {{ t('admin.tournaments.createTournament') }}
        </CButton>
      </div>
    </template>
  </DialogComponent>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegle } from '@regle/core'
import { dateAfter, minValue, numeric, required } from '@regle/rules'
import { DateTime } from 'luxon'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CSelect from '@/components/CSelect.vue'
import CTextArea from '@/components/CTextArea.vue'
import FilePondUploader from '@/components/FilePondUploader.vue'
import TournamentFormSection from './TournamentFormSection.vue'
import TournamentPreview from './TournamentPreview.vue'
import type { FilePondUploaderInstance } from '@/components/filePondUploader.model.ts'
import { deleteUploadedFiles, type UploadedFile } from '@/utils/fileUpload'
import {
  type CreateTournament,
  TournamentFormat,
  TournamentPrizeType,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import logger from '@/lib/logger'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import { toast } from 'vue-sonner'
import tournamentService from '@/features/tournaments/events/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t, locale } = useI18n()

interface Props {
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  created: [tournament: CreateTournament]
}>()

const TOURNAMENT_TYPES = Object.values(TournamentFormat)
const PRIZE_TYPES = Object.values(TournamentPrizeType)

const formatOptions = computed(() =>
  TOURNAMENT_TYPES.map((type) => ({
    value: type,
    label: t(`admin.tournaments.format.${type}`),
  })),
)
const PANES = ['edit', 'preview'] as const

type Pane = (typeof PANES)[number]

const emptyPrizes = (): Record<TournamentPrizeType, string> =>
  Object.fromEntries(PRIZE_TYPES.map((prize) => [prize, ''])) as Record<
    TournamentPrizeType,
    string
  >

const createFormData = (): {
  title: string
  place: string
  organizer: string
  startsAt: string
  maxParticipants: string
  format: TournamentFormat
  description: string
  prizes: Record<TournamentPrizeType, string>
} => ({
  title: '',
  place: '',
  organizer: '',
  startsAt: '',
  maxParticipants: '',
  format: TournamentFormat.singleElimination,
  description: '',
  prizes: emptyPrizes(),
})

const formData = ref(createFormData())
const isSubmitting = ref<boolean>(false)
const hasCover = ref<boolean>(false)
const coverPreview = ref<string | undefined>(undefined)
const activePane = ref<Pane>('edit')
const coverUploader = useTemplateRef<FilePondUploaderInstance>('coverUploader')

const coverFolder = computed((): string => {
  const tenantId = tenantStore.tenant?.id
  return tenantId
    ? `tenants/${tenantId}/tournaments`
    : 'tenants/default/tournaments'
})

// Only prizes with a value are sent, keyed by the language they were typed in.
const prizes = computed((): CreateTournament['prizes'] => {
  const filled = PRIZE_TYPES.filter((prize) =>
    formData.value.prizes[prize].trim(),
  )
  if (!filled.length) return undefined

  return Object.fromEntries(
    filled.map((prize) => [
      prize,
      { [locale.value]: formData.value.prizes[prize].trim() },
    ]),
  ) as CreateTournament['prizes']
})

// What the form would save, minus the cover — which only gets a URL once it is
// uploaded on submit. The preview renders this, so it cannot drift from the
// record that is actually written.
const draft = computed((): CreateTournament => {
  const startsAt = DateTime.fromISO(formData.value.startsAt)

  return {
    title: formData.value.title.trim(),
    place: formData.value.place.trim(),
    organizer: formData.value.organizer.trim(),
    startsAt: startsAt.isValid ? (startsAt.toISO() ?? '') : '',
    participants: 0,
    maxParticipants: Number(formData.value.maxParticipants) || 0,
    format: formData.value.format,
    ...(formData.value.description.trim()
      ? { description: formData.value.description.trim() }
      : {}),
    ...(prizes.value ? { prizes: prizes.value } : {}),
    status: TournamentStatus.scheduled,
  }
})

// The picked file has no URL until submit, so the preview shows it straight
// from the browser. Every object URL created here is released again below.
const releaseCoverPreview = (): void => {
  if (!coverPreview.value) return
  URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = undefined
}

const onCoverChange = (files: boolean): void => {
  hasCover.value = files
  releaseCoverPreview()

  const [file] = coverUploader.value?.getFiles() ?? []
  if (files && file) coverPreview.value = URL.createObjectURL(file)
}

onBeforeUnmount(releaseCoverPreview)

const { r$ } = useRegle(formData, {
  title: { required },
  place: { required },
  organizer: { required },
  startsAt: {
    required,
    dateAfter: dateAfter(
      DateTime.local().minus({ days: 1 }).startOf('day').toJSDate(),
    ),
  },
  maxParticipants: { required, numeric, minValue: minValue(2) },
})

const resetForm = (): void => {
  formData.value = createFormData()
  hasCover.value = false
  activePane.value = 'edit'
  releaseCoverPreview()
  coverUploader.value?.reset()
  r$.$reset()
}

const submit = async (): Promise<void> => {
  if (!tenantStore.tenant || !editionStore.edition) return

  if (isSubmitting.value) return

  const { valid } = await r$.$validate()
  if (!valid) {
    logger.debug('Form has validation errors', r$.$errors)
    // The errors are all in the form, which may be the pane out of view.
    activePane.value = 'edit'
    return
  }

  isSubmitting.value = true

  try {
    // The cover is only uploaded once the form is known to be valid.
    let coverFile: UploadedFile | undefined
    if (hasCover.value && coverUploader.value) {
      ;[coverFile] = await coverUploader.value.upload()
      if (!coverFile) {
        toast.error(t('admin.tournaments.form.coverUploadFailed'))
        return
      }
    }

    const tournament: CreateTournament = {
      ...draft.value,
      ...(coverFile ? { cover: coverFile.url } : {}),
    }

    try {
      await tournamentService.create(
        tenantStore.tenant.id,
        editionStore.edition.id,
        tournament,
      )
      emit('created', tournament)
      resetForm()
      emit('close')
    } catch (error) {
      logger.error('Unable to create tournament', { error })
      // The tournament never made it to the database — drop its cover too.
      if (coverFile) await deleteUploadedFiles([coverFile])
      toast.error('Unable to create tournament. Try again later')
    }
  } finally {
    isSubmitting.value = false
  }
}

defineExpose({
  submit,
})
</script>
