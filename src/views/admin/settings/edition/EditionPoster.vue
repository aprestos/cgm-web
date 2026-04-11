<template>
  <SettingsSection
    title="Event Poster"
    description="Upload a promotional poster for your event"
  >
    <div class="flex items-center gap-x-8">
      <img
        v-if="posterPreview"
        :src="posterPreview"
        alt="Edition poster"
        class="h-32 w-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
      />
      <div
        v-else
        class="h-32 w-24 flex-none rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center outline -outline-offset-1 outline-black/5 dark:outline-white/10"
      >
        <span class="text-gray-400 dark:text-gray-600 text-sm">No poster</span>
      </div>
      <div>
        <CButton variant="secondary" @click="showPosterUploadDialog = true">
          Change poster
        </CButton>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          JPG, PNG, GIF or WebP. Recommended size: 800x600px. Max file size:
          10MB.
        </p>
        <FilePondUploadDialog
          :open="showPosterUploadDialog"
          title="Upload Poster"
          description="Select a poster image for your edition (max 10MB)"
          :allow-multiple="false"
          :accepted-file-types="[
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ]"
          max-file-size="10MB"
          :max-files="1"
          supabase-bucket="images"
          :supabase-path="posterFolder"
          file-naming-strategy="uuid"
          :supabase-options="{
            cacheControl: '31536000',
            upsert: false,
          }"
          @close="showPosterUploadDialog = false"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
        />
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import FilePondUploadDialog from '@/components/FilePondUploadDialog.vue'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'

interface Props {
  poster: string
}

interface Emits {
  (e: 'update:poster', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showPosterUploadDialog = ref(false)
const posterPreview = ref<string | null>(props.poster || null)

// Watch for external poster changes
watch(
  () => props.poster,
  (newValue) => {
    posterPreview.value = newValue || null
  },
)

// Computed folder path for poster uploads
const posterFolder = computed((): string => {
  const tenantId = tenantStore.value?.id
  return tenantId ? `tenants/${tenantId}/posters` : 'tenants/default/posters'
})

// Handle poster upload success
const handleUploadSuccess = (urls: string[]): void => {
  showPosterUploadDialog.value = false
  const url = urls[0]
  if (url) {
    posterPreview.value = url
    emit('update:poster', url)
    logger.debug('Poster uploaded successfully:', { url })
    toast.success('Poster uploaded successfully!')
  }
}

// Handle poster upload error
const handleUploadError = (error: unknown): void => {
  console.error('Poster upload failed:', error)
  toast.error('Failed to upload poster. Please try again.')
}
</script>
