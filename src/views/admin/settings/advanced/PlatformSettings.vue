<template>
  <SettingsSection
    title="Platform Settings"
    description="Configure platform-wide settings including language, timezone, and display preferences"
  >
    <form @submit="handleSubmit">
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <div class="sm:col-span-3">
          <label
            for="language"
            class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            Default Language
          </label>
          <select
            id="language"
            v-model="formData.language"
            name="language"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div class="sm:col-span-3">
          <label
            for="timezone"
            class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            Timezone
          </label>
          <select
            id="timezone"
            v-model="formData.timezone"
            name="timezone"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Lisbon">Europe/Lisbon (WET)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="America/Los_Angeles">
              America/Los Angeles (PST)
            </option>
          </select>
        </div>

        <div class="sm:col-span-3">
          <label
            for="date-format"
            class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            Date Format
          </label>
          <select
            id="date-format"
            v-model="formData.dateFormat"
            name="date-format"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div class="sm:col-span-3">
          <label
            for="time-format"
            class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            Time Format
          </label>
          <select
            id="time-format"
            v-model="formData.timeFormat"
            name="time-format"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800"
          >
            <option value="24h">24-hour</option>
            <option value="12h">12-hour (AM/PM)</option>
          </select>
        </div>
      </div>
    </form>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import SettingsSection from '@/components/SettingsSection.vue'
import logger from '@/lib/logger.ts'

// Form data
const formData = ref({
  language: 'en',
  timezone: 'Europe/Lisbon',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
})

const isSaving = ref(false)

// Save settings
const saveSettings = async (): Promise<void> => {
  try {
    await Promise.resolve()
    isSaving.value = true

    // TODO: Implement actual save to backend
    logger.debug('Saving platform settings:', { formData: formData.value })

    toast.success('Platform settings saved successfully!')
  } catch (error) {
    logger.error('Error saving platform settings:', { error })
    toast.error('Failed to save settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Handle form submit
const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()
  if (isSaving.value) return
  await saveSettings()
}

defineExpose({ save: saveSettings, isSaving })
</script>
