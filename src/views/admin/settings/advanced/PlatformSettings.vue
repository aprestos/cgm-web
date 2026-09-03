<template>
  <SettingsSection
    title="Platform Settings"
    description="Configure platform-wide settings including language, timezone, and display preferences"
  >
    <form @submit="handleSubmit">
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <CSelect
          id="language"
          v-model="formData.language"
          label="Default Language"
          :items="languageOptions"
          class="sm:col-span-3"
        />

        <CSelect
          id="timezone"
          v-model="formData.timezone"
          label="Timezone"
          :items="timezoneOptions"
          class="sm:col-span-3"
        />

        <CSelect
          id="date-format"
          v-model="formData.dateFormat"
          label="Date Format"
          :items="dateFormatOptions"
          class="sm:col-span-3"
        />

        <CSelect
          id="time-format"
          v-model="formData.timeFormat"
          label="Time Format"
          :items="timeFormatOptions"
          class="sm:col-span-3"
        />
      </div>
    </form>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import SettingsSection from '@/components/SettingsSection.vue'
import CSelect from '@/components/CSelect.vue'
import logger from '@/lib/logger.ts'

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Lisbon', label: 'Europe/Lisbon (WET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
]

const dateFormatOptions = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const timeFormatOptions = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour (AM/PM)' },
]

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
