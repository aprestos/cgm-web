<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import SettingsSection from '@/components/SettingsSection.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import CTextArea from '@/components/CTextArea.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import {
  IconEdit,
  IconMapPin,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-vue'
import type { LibraryLocation } from '@/features/library/locations/location.model.ts'
import { libraryLocationService } from '@/features/library/locations/service.ts'
import { queueService } from '@/features/queues/queue.service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import logger from '@/lib/logger.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const locations = ref<LibraryLocation[]>([])
const isLoading = ref(false)
const newLocationName = ref('')
const isAddingLocation = ref(false)

// Import Games State
interface GameImport {
  bggId: string
  owner: string
}

const gamesToImport = ref<GameImport[]>([])
const isBulkEditorOpen = ref(false)
const bulkImportText = ref('')

// Load locations on mount
onMounted(async () => {
  await loadLocations()
})

const loadLocations = async (): Promise<void> => {
  try {
    isLoading.value = true
    locations.value = await libraryLocationService.get()
  } catch (error) {
    console.error('Error loading locations:', error)
    toast.error('Failed to load locations')
  } finally {
    isLoading.value = false
  }
}

const addLocation = async (): Promise<void> => {
  if (!newLocationName.value.trim()) {
    toast.error('Please enter a location name')
    return
  }

  try {
    isAddingLocation.value = true
    await libraryLocationService.create(newLocationName.value.trim())
    toast.success('Location added successfully')
    newLocationName.value = ''
    await loadLocations()
  } catch (error) {
    console.error('Error adding location:', error)
    toast.error('Failed to add location')
  } finally {
    isAddingLocation.value = false
  }
}

const deleteLocation = async (id: number): Promise<void> => {
  try {
    await libraryLocationService.delete(id)
    toast.success('Location deleted successfully')
    await loadLocations()
  } catch (error) {
    logger.error('Error deleting location.', { error })
    toast.error('Failed to delete location.')
  }
}

// Import Games Methods
const openBulkEditor = (): void => {
  // Pre-fill with existing games
  bulkImportText.value = gamesToImport.value
    .map((game) => `${game.bggId},${game.owner}`)
    .join('\n')
  isBulkEditorOpen.value = true
}

const processBulkImport = (): void => {
  const lines = bulkImportText.value.trim().split('\n')
  const newGames: GameImport[] = []

  for (const line of lines) {
    if (!line.trim()) continue

    const parts = line.split(',').map((p) => p.trim())
    if (parts.length >= 1 && parts[0]) {
      newGames.push({
        bggId: parts[0],
        owner: parts[1] || '',
      })
    }
  }

  if (newGames.length === 0) {
    toast.error('No valid games found in the input')
    return
  }

  gamesToImport.value = newGames
  isBulkEditorOpen.value = false
  toast.success(`${newGames.length} game(s) ready to import`)
}

const removeGameImport = (index: number): void => {
  gamesToImport.value.splice(index, 1)
}

const clearImportList = (): void => {
  gamesToImport.value = []
}

const importGames = async (): Promise<void> => {
  await queueService.add(
    tenantStore.tenant?.id,
    editionStore.edition?.id,
    'library-games',
    gamesToImport.value,
  )
  void queueService.process()
  clearImportList()

  toast.success('Games added to import queue')
}
</script>

<template>
  <SettingsSection
    title="Library Locations"
    description="Manage the physical locations where games are stored in your library"
  >
    <!-- Add New Location Form -->
    <div class="mb-6">
      <label
        for="new-location"
        class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
      >
        Add New Location
      </label>
      <div class="flex gap-3">
        <div class="flex-1">
          <CInput
            id="new-location"
            v-model="newLocationName"
            label=""
            type="text"
            name="new-location"
            placeholder="e.g., Shelf A1, Table 3, Storage Room..."
            @keyup.enter="addLocation"
          />
        </div>
        <CButton type="button" :loading="isAddingLocation" @click="addLocation">
          <IconPlus class="h-5 w-5 mr-2 -ml-1" />
          Add Location
        </CButton>
      </div>
    </div>

    <!-- Locations List -->
    <div class="mt-6">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
        Current Locations
      </h3>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="locations?.length === 0"
        class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
      >
        <IconMapPin
          class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
        />
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          No locations
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new location.
        </p>
      </div>

      <!-- Locations Grid -->
      <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="location in locations"
          :key="location.id"
          class="relative flex items-center justify-between gap-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center gap-x-3 flex-1 min-w-0">
            <IconMapPin
              class="h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400"
            />
            <span
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
            >
              {{ location.name }}
            </span>
          </div>
          <button
            type="button"
            class="flex-shrink-0 rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            @click="deleteLocation(location.id)"
          >
            <span class="sr-only">Delete {{ location.name }}</span>
            <IconTrash class="h-5 w-5" />
          </button>
        </li>
      </ul>
    </div>
  </SettingsSection>

  <!-- Import Games Section -->
  <SettingsSection
    title="Import Games"
    description="Bulk import games into your library using BGG IDs and owner information"
    class="mt-8"
  >
    <!-- Bulk Editor Button -->
    <div class="mb-6 flex justify-end">
      <CButton type="button" variant="secondary" @click="openBulkEditor">
        <IconEdit class="h-5 w-5 mr-2 -ml-1" />
        Bulk Editor
      </CButton>
    </div>

    <!-- Games to Import Table -->
    <div class="mt-6">
      <!-- Empty State -->
      <div
        v-if="gamesToImport.length === 0"
        class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
      >
        <IconUpload
          class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
        />
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          No games to import
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use the bulk editor to add games to the import list.
        </p>
      </div>

      <!-- Games Table -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                BGG ID
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Owner
              </th>
              <th scope="col" class="relative px-4 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr
              v-for="(game, index) in gamesToImport"
              :key="index"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td
                class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ game.bggId }}
              </td>
              <td
                class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {{ game.owner || '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                <button
                  type="button"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  @click="removeGameImport(index)"
                >
                  <IconTrash class="h-5 w-5" />
                  <span class="sr-only">Remove</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Buttons Below Table -->
    <div v-if="gamesToImport.length > 0" class="mt-6 flex justify-end gap-3">
      <CButton type="button" variant="secondary" @click="clearImportList">
        <IconTrash class="h-5 w-5 mr-2 -ml-1" />
        Clear All
      </CButton>
      <CButton type="button" @click="importGames">
        <IconUpload class="h-5 w-5 mr-2 -ml-1" />
        Import {{ gamesToImport.length }} Game(s)
      </CButton>
    </div>
  </SettingsSection>

  <!-- Bulk Import Dialog -->
  <DialogComponent
    v-model:open="isBulkEditorOpen"
    title="Bulk Import Games"
    @close="isBulkEditorOpen = false"
  >
    <div class="space-y-4">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Enter games to import, one per line. Use comma to separate BGG ID and
          owner.
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Format:
          <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded"
            >BGG_ID,Owner</code
          >
        </p>
      </div>

      <CTextArea
        id="bulk-import-dialog"
        v-model="bulkImportText"
        label="Games Data"
        placeholder="174430,John Doe&#10;167791,Jane Smith&#10;13,Board Game Club"
        :rows="12"
      />

      <div class="text-xs text-gray-500 dark:text-gray-500">
        <p class="font-medium mb-1">Examples:</p>
        <code class="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
          174430,John Doe<br />
          167791,Jane Smith<br />
          13,Board Game Club
        </code>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-4">
        <CButton
          type="button"
          variant="secondary"
          @click="isBulkEditorOpen = false"
        >
          Cancel
        </CButton>
        <CButton type="button" @click="processBulkImport"> Process </CButton>
      </div>
    </div>
  </DialogComponent>
</template>

<style scoped></style>
