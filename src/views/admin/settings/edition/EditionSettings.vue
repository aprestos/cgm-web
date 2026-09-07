<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
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
          placeholder="e.g., https://maps.app.goo.gl/..."
          helper-text="Optional. Share link used for directions — the map itself is rendered from the location name."
        />
      </div>
    </SettingsSection>
    <EditionPoster
      v-model:poster="formData.poster"
      @uploaded="handlePosterUploaded"
    />
  </div>

  <FloatingActionBar class="lg:pl-72">
    <CButton
      size="lg"
      type="button"
      rounded
      :loading="isSaving"
      loading-text="Saving..."
      @click="saveEdition"
    >
      <template #icon-left>
        <IconDeviceFloppy class="h-4 w-4" aria-hidden="true" />
      </template>
      Save
    </CButton>
  </FloatingActionBar>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import EditionPoster from './EditionPoster.vue'
import { editionService } from '@/features/events/service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import logger from '@/lib/logger.ts'
import CInput from '@/components/CInput.vue'
import CButton from '@/components/CButton.vue'
import FloatingActionBar from '@/components/FloatingActionBar.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import { IconDeviceFloppy } from '@tabler/icons-vue'
import { deleteUploadedFiles, type UploadedFile } from '@/utils/fileUpload'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

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

// Poster already in storage but not yet saved on the edition. Kept so it can be
// removed again if it never gets persisted.
const pendingPoster = ref<UploadedFile | null>(null)

const handlePosterUploaded = async (file: UploadedFile): Promise<void> => {
  // A previous pick that was never saved is now unreachable — drop it.
  const replaced = pendingPoster.value
  pendingPoster.value = file

  if (replaced) await deleteUploadedFiles([replaced])
}

// Load initial data from editionStore
onMounted(() => {
  if (editionStore.edition) {
    // Parse start_date (ISO datetime) into date and time
    if (editionStore.edition.start_date) {
      const startDateTime = new Date(editionStore.edition.start_date)
      formData.value.startDate = startDateTime.toISOString().split('T')[0] ?? ''
      formData.value.startTime =
        startDateTime.toTimeString().slice(0, 5) ?? '09:00'
    }
    // Parse end_date (ISO datetime) into date and time
    if (editionStore.edition.end_date) {
      const endDateTime = new Date(editionStore.edition.end_date)
      formData.value.endDate = endDateTime.toISOString().split('T')[0] ?? ''
      formData.value.endTime = endDateTime.toTimeString().slice(0, 5) ?? '18:00'
    }
    if (editionStore.edition.name) {
      formData.value.name = editionStore.edition.name
    }
    if (editionStore.edition.location?.title) {
      formData.value.locationTitle = editionStore.edition.location.title
    }
    if (editionStore.edition.location?.url) {
      formData.value.locationUrl = editionStore.edition.location.url
    }
    if (editionStore.edition.description) {
      formData.value.description = editionStore.edition.description
    }
    if (editionStore.edition.long_description) {
      formData.value.longDescription = editionStore.edition.long_description
    }
    if (editionStore.edition.poster_url) {
      formData.value.poster = editionStore.edition.poster_url
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

    await editionService.save(
      tenantStore.tenant?.id,
      editionStore.edition?.id,
      {
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
      },
    )

    // Update editionStore with new values
    if (editionStore.edition) {
      editionStore.edition = {
        ...editionStore.edition,
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

    // The poster is persisted now, so there is nothing left to roll back.
    pendingPoster.value = null

    logger.debug('Edition settings saved successfully')
    toast.success('Edition settings saved successfully!')
  } catch (error) {
    logger.error('Error saving edition settings:', { error })

    // Nothing was saved — remove the poster upload and restore the previous one
    // so the preview keeps matching what is actually in storage.
    if (pendingPoster.value) {
      const orphan = pendingPoster.value
      pendingPoster.value = null
      formData.value.poster = initialValues.value.poster
      await deleteUploadedFiles([orphan])
    }

    toast.error('Failed to save edition settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>
