<template>
  <SettingsSection
    title="Data Management"
    description="Export, import, and manage your convention data"
  >
    <div class="space-y-8">
      <!-- Export Data -->
      <div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Export Data
        </h3>
        <div class="space-y-4">
          <div
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Export All Settings
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Download all platform settings as JSON
              </p>
            </div>
            <CButton type="button" variant="secondary" @click="exportSettings">
              <IconDownload class="h-5 w-5 mr-2 -ml-1" />
              Export
            </CButton>
          </div>

          <div
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Export Event Data
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Export attendees, tickets, and event information
              </p>
            </div>
            <CButton type="button" variant="secondary" @click="exportEventData">
              <IconDownload class="h-5 w-5 mr-2 -ml-1" />
              Export
            </CButton>
          </div>

          <div
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Export Library Data
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Export game collection and lending history
              </p>
            </div>
            <CButton
              type="button"
              variant="secondary"
              @click="exportLibraryData"
            >
              <IconDownload class="h-5 w-5 mr-2 -ml-1" />
              Export
            </CButton>
          </div>
        </div>
      </div>

      <!-- Import Data -->
      <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Import Data
        </h3>
        <div
          class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6"
        >
          <div class="text-center">
            <IconUpload
              class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            />
            <h3
              class="mt-2 text-sm font-semibold text-gray-900 dark:text-white"
            >
              Import Configuration
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload a previously exported settings file
            </p>
            <div class="mt-6">
              <CButton type="button" @click="triggerFileUpload">
                <IconUpload class="h-5 w-5 mr-2 -ml-1" />
                Select File
              </CButton>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                class="hidden"
                @change="handleFileUpload"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Backup & Restore -->
      <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Backup & Restore
        </h3>
        <div
          class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex">
            <div class="shrink-0">
              <IconInfoCircle
                class="h-5 w-5 text-blue-400"
                aria-hidden="true"
              />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Automatic Backups
              </h3>
              <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Your data is automatically backed up daily. Contact support if
                  you need to restore from a backup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="pt-8 border-t border-red-200 dark:border-red-800">
        <h3 class="text-base font-semibold text-red-900 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <div
          class="rounded-lg border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-900/20"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-900 dark:text-red-300">
                Clear All Data
              </p>
              <p class="text-sm text-red-700 dark:text-red-400">
                Permanently delete all convention data. This action cannot be
                undone.
              </p>
            </div>
            <CButton
              type="button"
              variant="secondary"
              class="bg-red-600 hover:bg-red-700 text-white"
              @click="confirmClearData"
            >
              Clear Data
            </CButton>
          </div>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { IconDownload, IconUpload, IconInfoCircle } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import logger from '@/lib/logger.ts'

const fileInput = ref<HTMLInputElement | null>(null)

// Export functions
const exportSettings = (): void => {
  // TODO: Implement actual export
  logger.debug('Exporting settings')
  toast.success('Settings exported successfully!')
}

const exportEventData = (): void => {
  // TODO: Implement actual export
  logger.debug('Exporting event data')
  toast.success('Event data exported successfully!')
}

const exportLibraryData = (): void => {
  // TODO: Implement actual export
  logger.debug('Exporting library data')
  toast.success('Library data exported successfully!')
}

// Import functions
const triggerFileUpload = (): void => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // TODO: Implement actual import
    logger.debug('Importing file:', { fileName: file.name })
    toast.success(`Importing ${file.name}...`)
  }
}

// Danger zone
const confirmClearData = (): void => {
  // TODO: Show confirmation dialog
  toast.error('This feature requires confirmation')
}
</script>
