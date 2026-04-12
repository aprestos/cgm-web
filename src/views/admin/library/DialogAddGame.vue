<template>
  <DialogComponent
    :open="open"
    :title="t('admin.library.addGame')"
    @close="emit('close')"
  >
    <form>
      <div class="space-y-12 mx-auto max-w-7xl">
        <div class="pb-12">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <CSelect2
              id="external-game"
              v-model="formData.selectedGame"
              :label="t('admin.library.game')"
              :search-fn="
                async (query) => {
                  const results = await gameService.search(query)
                  return results.map((item) => ({
                    value: item.externalId,
                    label: item.name,
                    secondaryLabel: item.year ? `(${item.year})` : undefined,
                  })) as Array<Option<string>>
                }
              "
              :errors="r$.$errors.selectedGame"
            />

            <CInput
              id="owner"
              v-model="formData.owner"
              :label="t('admin.library.owner')"
              :errors="r$.$errors.owner"
            />

            <CSelect
              id="location"
              v-model="formData.selectedLocation"
              :label="t('admin.library.location')"
              :placeholder="t('admin.library.selectALocation')"
              :options="locations"
              :errors="r$.$errors.selectedLocation"
              :helper-text="t('admin.library.optional')"
            />

            <CTextArea
              id="notes"
              v-model="formData.notes"
              :label="t('admin.library.notes')"
              :rows="4"
              :errors="r$.$errors.notes"
              :helper-text="t('admin.library.optional')"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </CButton>
        <CButton
          type="button"
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('admin.library.submitting')"
          @click="submit"
        >
          {{ t('admin.library.submit') }}
        </CButton>
      </div>
    </form>
  </DialogComponent>
</template>

<script lang="ts" setup>
import { useRegle } from '@regle/core'
import { required } from '@regle/rules'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Option } from 'vue3-select-component'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CSelect from '@/components/CSelect.vue'
import CTextArea from '@/components/CTextArea.vue'
import type { Game } from '@/features/external-game/model.ts'
import gameService from '@/features/external-game/service.ts'
import { libraryService } from '@/features/library/games/service.ts'
import { libraryLocationService } from '@/features/library/locations/service.ts'
import logger from '@/lib/logger.ts'
import { toast } from 'vue-sonner'
import CSelect2 from '@/CSelect2.vue'
import { LibraryGameStatus } from '@/features/library/games/game.model.ts'

const { t } = useI18n()

interface Props {
  open: boolean
}

defineProps<Props>()

const formData = ref<{
  selectedGame: string | null
  owner: string
  selectedLocation: number | undefined
  notes: string
}>({
  selectedGame: null,
  owner: '',
  selectedLocation: undefined,
  notes: '',
})
const locations = ref<Option<number>[]>([])
const isSubmitting = ref<boolean>(false)

const emit = defineEmits<{
  'game-added': []
  close: []
}>()

const { r$ } = useRegle(formData, {
  selectedGame: { required },
  owner: { required },
})

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  // Validate form before submitting
  const { valid, data } = await r$.$validate()

  if (!valid) {
    logger.debug('Form has validation errors')
    return
  }

  isSubmitting.value = true

  try {
    if (formData.value.selectedGame) {
      const game: Game = await gameService.get(
        formData.value.selectedGame.toString(),
      )

      await libraryService.post(
        game.id,
        data.selectedLocation as number,
        data.owner,
        LibraryGameStatus.notAvailable,
        data.notes,
      )

      toast.success(t('admin.library.addSuccess'))

      // Emit event to notify parent that game was added successfully
      emit('close')
    }
  } finally {
    isSubmitting.value = false
  }
}

// Expose the submit function so parent components can call it
defineExpose({
  submit,
})

onMounted(async () => {
  const result = await libraryLocationService.get()

  locations.value = result.map((result) => {
    return {
      label: result.name,
      value: result.id,
    }
  })
})
</script>
