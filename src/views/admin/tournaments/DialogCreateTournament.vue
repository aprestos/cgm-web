<template>
  <DialogComponent
    :open="open"
    :title="t('admin.tournaments.createTournament')"
    size="lg"
    @close="emit('close')"
  >
    <form @submit.prevent="submit">
      <div class="space-y-6 mx-auto max-w-7xl">
        <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <CInput
            id="tournament-title"
            v-model="formData.title"
            :label="t('admin.tournaments.form.title')"
            :errors="r$.$errors.title"
            class="col-span-full"
          />

          <CInput
            id="tournament-place"
            v-model="formData.place"
            :label="t('admin.tournaments.form.place')"
            :errors="r$.$errors.place"
            class="col-span-full sm:col-span-1"
          />

          <CInput
            id="tournament-organizer"
            v-model="formData.organizer"
            :label="t('admin.tournaments.form.organizer')"
            :errors="r$.$errors.organizer"
            class="col-span-full sm:col-span-1"
          />

          <CInput
            id="tournament-starts-at"
            v-model="formData.startsAt"
            type="datetime-local"
            :label="t('admin.tournaments.form.startsAt')"
            :errors="r$.$errors.startsAt"
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

          <!-- Tournament type -->
          <div class="col-span-full sm:col-span-1">
            <label
              for="tournament-type"
              class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
            >
              {{ t('admin.tournaments.form.type') }}
            </label>
            <div class="mt-2">
              <select
                id="tournament-type"
                v-model="formData.format"
                class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"
              >
                <option
                  v-for="type in TOURNAMENT_TYPES"
                  :key="type"
                  :value="type"
                >
                  {{ t(`admin.tournaments.type.${type}`) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <CTextArea
          id="tournament-description"
          v-model="formData.description"
          :label="t('admin.tournaments.form.description')"
          :rows="3"
          :helper-text="t('common.actions.optional')"
        />

        <!-- Prizes — optional, stored per prize type in the current language -->
        <div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
            :aria-expanded="showPrizes"
            aria-controls="tournament-prizes"
            @click="showPrizes = !showPrizes"
          >
            <IconChevronRight
              class="size-4 transition-transform"
              :class="showPrizes ? 'rotate-90' : ''"
            />
            {{ t('admin.tournaments.form.prizes') }}
            <span class="font-normal text-gray-500 dark:text-gray-400">
              ({{ t('common.actions.optional') }})
            </span>
          </button>

          <div
            v-if="showPrizes"
            id="tournament-prizes"
            class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
          >
            <CInput
              v-for="prize in PRIZE_TYPES"
              :id="`tournament-prize-${prize}`"
              :key="prize"
              v-model="formData.prizes[prize]"
              :label="t(`admin.tournaments.prize.${prize}`)"
              class="col-span-full sm:col-span-1"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end mt-6">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.actions.cancel') }}
        </CButton>
        <CButton
          type="button"
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('common.actions.submitting')"
          @click="submit"
        >
          {{ t('admin.tournaments.createTournament') }}
        </CButton>
      </div>
    </form>
  </DialogComponent>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegle } from '@regle/core'
import { dateAfter, minValue, numeric, required } from '@regle/rules'
import { IconChevronRight } from '@tabler/icons-vue'
import { DateTime } from 'luxon'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CTextArea from '@/components/CTextArea.vue'
import {
  type CreateTournament,
  TournamentFormat,
  TournamentPrizeType,
  TournamentStatus,
} from '@/features/tournaments/model'
import logger from '@/lib/logger'
import tournamentService from '@/features/tournaments/service.ts'
import { tenantStore } from '@/features/tenant/tenant.store.ts'
import { editionStore } from '@/features/events/edition.store.ts'
import { toast } from 'vue-sonner'

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
const showPrizes = ref<boolean>(false)

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
  showPrizes.value = false
  r$.$reset()
}

// Only prizes with a value are sent, keyed by the language they were typed in.
const buildPrizes = (): CreateTournament['prizes'] => {
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
}

const submit = async (): Promise<void> => {
  if (!tenantStore.value || !editionStore.value) return

  if (isSubmitting.value) return

  const { valid } = await r$.$validate()
  if (!valid) {
    logger.debug('Form has validation errors', r$.$errors)
    return
  }

  isSubmitting.value = true

  try {
    const prizes = buildPrizes()

    const tournament: CreateTournament = {
      title: formData.value.title.trim(),
      place: formData.value.place.trim(),
      organizer: formData.value.organizer.trim(),
      startsAt: DateTime.fromISO(formData.value.startsAt).toISO() ?? '',
      participants: 0,
      maxParticipants: Number(formData.value.maxParticipants),
      format: formData.value.format,
      ...(formData.value.description.trim()
        ? { description: formData.value.description.trim() }
        : {}),
      ...(prizes ? { prizes } : {}),
      status: TournamentStatus.scheduled,
    }

    try {
      await tournamentService.create(
        tenantStore.value.id,
        editionStore.value.id,
        tournament,
      )
      emit('created', tournament)
      resetForm()
      emit('close')
    } catch (error) {
      logger.error('Unable to create tournament', { error })
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
