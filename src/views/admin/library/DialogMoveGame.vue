<template>
  <DialogComponent
    :open="props.open"
    :title="t('admin.library.moveGame')"
    @close="handleClose"
  >
    <div v-if="props.selectedGame" class="space-y-6">
      <!-- Game Info -->
      <div class="flex items-center space-x-4">
        <div class="shrink-0">
          <img
            class="size-16 rounded-lg object-cover shadow-sm"
            :src="props.selectedGame.game.image"
            :alt="props.selectedGame.game.name"
            @error="handleImageError"
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white truncate"
          >
            {{ props.selectedGame.game.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.library.currentLocation') }}: {{ currentLocationName }}
          </p>
        </div>
      </div>

      <!-- Location Selection -->
      <CSelect
        id="location"
        v-model="selectedLocationId"
        :label="t('admin.library.newLocation')"
        :options="locationOptions"
        :placeholder="t('admin.library.selectALocation')"
      />

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          class="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          @click="handleClose"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSaving || selectedLocationId === null"
          @click="moveGame"
        >
          <span v-if="isSaving">{{ t('admin.library.moving') }}</span>
          <span v-else>{{ t('admin.library.moveGame') }}</span>
        </button>
      </div>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogComponent from '@/components/DialogComponent.vue'
import CSelect from '@/components/CSelect.vue'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import { toast } from 'vue-sonner'
import libraryService from '@/features/library/games/service.ts'
import { libraryLocationService } from '@/features/library/locations/service.ts'

const { t } = useI18n()

interface Props {
  open?: boolean
  selectedGame?: LibraryGame | null
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  selectedGame: null,
  locations: () => [],
})

const emit = defineEmits<Emits>()

const locations = ref<LibraryLocation[]>([])
const selectedLocationId = ref<number | null>(null)
const isSaving = ref(false)

// Watch for selectedGame changes to update the selected location
watch(
  () => props.selectedGame,
  async (game) => {
    if (game) {
      locations.value = await libraryLocationService.get()
      selectedLocationId.value = game.location?.id || null
    }
  },
  { immediate: true },
)

// Computed properties
const locationOptions = computed(() => {
  return locations.value.map((loc: LibraryLocation) => ({
    value: loc.id,
    label: loc.name,
  }))
})

const currentLocationName = computed(() => {
  if (!props.selectedGame?.location) return '-'
  return props.selectedGame.location.name
})

// Event handlers
const handleClose = (): void => {
  selectedLocationId.value = null
  emit('close')
}

const moveGame = async (): Promise<void> => {
  if (!props.selectedGame || !selectedLocationId.value) return
  isSaving.value = true
  try {
    const newLocation = locations.value.find(
      (loc) => loc.id === selectedLocationId.value,
    )
    await libraryService.updateGame(props.selectedGame.id, {
      location_id: selectedLocationId.value,
    } as Partial<LibraryGame>)
    toast.success(
      t('admin.library.moveSuccess', {
        name: props.selectedGame.game.name,
        location: newLocation?.name || '',
      }),
    )
    emit('close')
  } catch (error) {
    console.error('Failed to move game:', error)
    toast.error(t('admin.library.moveFailed'))
  } finally {
    isSaving.value = false
  }
}

const handleImageError = (event: Event): void => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>
