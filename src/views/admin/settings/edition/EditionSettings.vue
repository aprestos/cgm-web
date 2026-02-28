<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10 pb-16">
    <SettingsSection
      title="General Information"
      description="Set the start and end dates for your event"
    >
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <CInput
          id="edition-name"
          v-model="formData.name"
          label="Name"
          type="text"
          name="edition-name"
          class="sm:col-span-6"
        />
        <CInput
          id="start-date"
          v-model="formData.startDate"
          label="Start Date"
          type="date"
          name="start-date"
          class="sm:col-span-3"
        />

        <CInput
          id="start-time"
          v-model="formData.startTime"
          label="Start Time"
          type="time"
          name="start-time"
          class="sm:col-span-3"
        />

        <CInput
          id="end-date"
          v-model="formData.endDate"
          label="End Date"
          type="date"
          name="end-date"
          class="sm:col-span-3"
        />

        <CInput
          id="end-time"
          v-model="formData.endTime"
          label="End Time"
          type="time"
          name="end-time"
          class="sm:col-span-3"
        />
      </div>
    </SettingsSection>
    <SettingsSection
      title="Location"
      description="Set the venue location and map link"
    >
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <CInput
          id="location-title"
          v-model="formData.locationTitle"
          label="Location"
          type="text"
          name="location-title"
          class="sm:col-span-6"
          placeholder="e.g., Convention Center Downtown"
        />

        <CInput
          id="location-url"
          v-model="formData.locationUrl"
          label="Location URL"
          type="text"
          name="location-url"
          class="sm:col-span-6"
          placeholder="e.g., https://maps.google.com/..."
        />
      </div>
    </SettingsSection>
    <EditionPoster v-model:poster="formData.poster" />
  </div>
  <SettingsBottomBar :loading="isSaving" @save="saveEdition" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import EditionPoster from './EditionPoster.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import { editionService } from '@/features/events/service.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { editionStore } from '@/stores/edition.ts'
import logger from '@/lib/logger.ts'
import CInput from '@/components/CInput.vue'
import SettingsSection from '@/components/SettingsSection.vue'

// Form data
const formData = ref({
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '18:00',
  name: '',
  locationTitle: '',
  locationUrl: '',
  description: '',
  longDescription: '',
  poster: '',
})

// Track initial values for comparison
const initialValues = ref({
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '18:00',
  name: '',
  locationTitle: '',
  locationUrl: '',
  description: '',
  longDescription: '',
  poster: '',
})

// Loading state for save operation
const isSaving = ref(false)

// Load initial data from editionStore
onMounted(() => {
  if (editionStore.value) {
    // Parse start_date (ISO datetime) into date and time
    if (editionStore.value.start_date) {
      const startDateTime = new Date(editionStore.value.start_date)
      formData.value.startDate = startDateTime.toISOString().split('T')[0] ?? ''
      formData.value.startTime =
        startDateTime.toTimeString().slice(0, 5) ?? '09:00'
    }
    // Parse end_date (ISO datetime) into date and time
    if (editionStore.value.end_date) {
      const endDateTime = new Date(editionStore.value.end_date)
      formData.value.endDate = endDateTime.toISOString().split('T')[0] ?? ''
      formData.value.endTime = endDateTime.toTimeString().slice(0, 5) ?? '18:00'
    }
    if (editionStore.value.name) {
      formData.value.name = editionStore.value.name
    }
    if (editionStore.value.location?.title) {
      formData.value.locationTitle = editionStore.value.location.title
    }
    if (editionStore.value.location?.url) {
      formData.value.locationUrl = editionStore.value.location.url
    }
    if (editionStore.value.description) {
      formData.value.description = editionStore.value.description
    }
    if (editionStore.value.long_description) {
      formData.value.longDescription = editionStore.value.long_description
    }
    if (editionStore.value.poster_url) {
      formData.value.poster = editionStore.value.poster_url
    }

    // Store initial values
    initialValues.value = JSON.parse(JSON.stringify(formData.value))
  }
})

// Save edition function
const saveEdition = async (): Promise<void> => {
  try {
    isSaving.value = true

    // Combine date and time into ISO datetime strings
    const startDateTime =
      formData.value.startDate && formData.value.startTime
        ? `${formData.value.startDate}T${formData.value.startTime}:00`
        : undefined
    const endDateTime =
      formData.value.endDate && formData.value.endTime
        ? `${formData.value.endDate}T${formData.value.endTime}:00`
        : undefined

    await editionService.save(tenantStore.value?.id, editionStore.value?.id, {
      ...(startDateTime && { start_date: startDateTime }),
      ...(endDateTime && { end_date: endDateTime }),
      ...(formData.value.name && { name: formData.value.name }),
      ...(formData.value.description && {
        description: formData.value.description,
      }),
      ...(formData.value.longDescription && {
        long_description: formData.value.longDescription,
      }),
      ...(formData.value.poster && { poster_url: formData.value.poster }),
      location: {
        title: formData.value.locationTitle,
        url: formData.value.locationUrl,
      },
    })

    // Update editionStore with new values
    if (editionStore.value) {
      editionStore.value = {
        ...editionStore.value,
        ...(startDateTime && { start_date: startDateTime }),
        ...(endDateTime && { end_date: endDateTime }),
        ...(formData.value.name && { name: formData.value.name }),
        ...(formData.value.description && {
          description: formData.value.description,
        }),
        ...(formData.value.longDescription && {
          long_description: formData.value.longDescription,
        }),
        ...(formData.value.poster && { poster_url: formData.value.poster }),
        location: {
          title: formData.value.locationTitle,
          url: formData.value.locationUrl,
        },
      }
    }

    // Update initial values after successful save
    initialValues.value = JSON.parse(JSON.stringify(formData.value))

    logger.debug('Edition settings saved successfully')
    toast.success('Edition settings saved successfully!')
  } catch (error) {
    logger.error('Error saving edition settings:', { error })
    toast.error('Failed to save edition settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>
