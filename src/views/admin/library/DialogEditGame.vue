<script setup lang="ts">
import { useRegle } from '@regle/core'
import { required } from '@regle/rules'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Option } from 'vue3-select-component'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CSelect from '@/components/CSelect.vue'
import CTextArea from '@/components/CTextArea.vue'
import { libraryLocationService } from '@/features/library/locations/service.ts'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import DialogComponent from '@/components/DialogComponent.vue'
import libraryService from '@/features/library/games/service.ts'
import { toast } from 'vue-sonner'

const { t } = useI18n()

interface Props {
  open: boolean
  game: LibraryGame | null
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
})

const formData = ref<{
  owner: string
  selectedLocation: number | undefined
  notes: string
}>({
  owner: '',
  selectedLocation: undefined,
  notes: '',
})

const locations = ref<Option<number>[]>([])
const isSubmitting = ref<boolean>(false)

const emit = defineEmits<{
  close: []
}>()

const { r$ } = useRegle(formData, {
  owner: { required },
})

watch(
  () => props.open,
  () => {
    if (props.open) {
      formData.value.owner = props.game?.owner || ''
      formData.value.selectedLocation = props.game?.location?.id
      formData.value.notes = props.game?.notes || ''
    }
  },
)

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  // Validate form before submitting
  const { valid } = await r$.$validate()

  if (!valid) {
    return
  }

  isSubmitting.value = true

  try {
    // Call the update service
    await libraryService.updateGame(props.game?.id as number, {
      ...(formData.value.owner && { owner: formData.value.owner }),
      location_id: formData.value.selectedLocation,
      ...(formData.value.notes && { notes: formData.value.notes }),
    })
    toast.success(
      t('admin.library.editSuccess', { name: props.game?.game.name }),
    )

    // Emit event to notify parent that game was updated successfully
    emit('close')
  } catch {
    toast.error(t('admin.library.editFailed'))
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

  locations.value = result.map((location) => {
    return {
      label: location.name,
      value: location.id,
    }
  })
})

const handleClose = (): void => {
  emit('close')
}
</script>

<template>
  <DialogComponent
    :title="t('admin.library.editGame')"
    :open="props.open"
    @close="handleClose"
  >
    <form>
      <div class="space-y-12 mx-auto max-w-7xl">
        <div class="">
          <div class="flex items-center space-x-4">
            <div class="shrink-0">
              <img
                class="size-16 rounded-lg object-cover shadow-sm"
                :src="game?.game.image || '/placeholder-game.jpg'"
                :alt="game?.game.name || t('admin.library.unknownGame')"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white truncate"
              >
                {{ game?.game.name || t('admin.library.unknownGame') }}
              </h3>
              <div
                class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
              >
                <span class="flex items-center">
                  <svg
                    class="size-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {{ game?.game.year || t('admin.library.unknown') }}
                </span>
                <span v-if="game?.location?.name" class="flex items-center">
                  <svg
                    class="size-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {{ game?.location?.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="pb-12">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
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
              :helper-text="t('admin.library.optional')"
            />

            <CTextArea
              id="notes"
              v-model="formData.notes"
              :label="t('admin.library.notes')"
              :rows="4"
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
          @click="handleClose"
        >
          {{ t('common.cancel') }}
        </CButton>
        <CButton
          type="button"
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('admin.library.updating')"
          @click="submit"
        >
          {{ t('admin.library.update') }}
        </CButton>
      </div>
    </form>
  </DialogComponent>
</template>
