<template>
  <DialogComponent :open="open" :title="title" @close="handleClose">
    <div class="space-y-4">
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <FilePondUploader
        ref="uploader"
        :allow-multiple="allowMultiple"
        :accepted-file-types="acceptedFileTypes"
        :max-file-size="maxFileSize"
        :max-files="maxFiles"
        :label-idle="labelIdle"
        :allow-image-preview="allowImagePreview"
        :image-preview-height="imagePreviewHeight"
        :supabase-bucket="supabaseBucket"
        :supabase-path="supabasePath"
        :supabase-options="supabaseOptions"
        :file-naming-strategy="fileNamingStrategy"
        :custom-file-namer="customFileNamer"
        @update:has-files="hasFiles = $event"
        @update:uploading="isUploading = $event"
        @update:progress="uploadProgress = $event"
        @upload-error="emit('upload-error', $event)"
        @file-added="emit('file-added', $event)"
        @file-removed="emit('file-removed', $event)"
        @file-error="emit('file-error', $event)"
      />

      <!-- Upload Progress -->
      <div
        v-if="isUploading"
        class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <div class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div class="text-blue-700 dark:text-blue-300">
            <p class="font-medium">{{ uploadingText }}</p>
            <p v-if="showProgress" class="text-sm">
              {{ uploadProgress }}% complete
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
        <CButton
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          :disabled="isUploading"
          @click="handleClose"
        >
          {{ isUploading ? 'Please wait...' : 'Cancel' }}
        </CButton>
        <CButton
          v-if="showUploadButton"
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :disabled="!hasFiles || isUploading"
          :loading="isUploading"
          :loading-text="uploadingText"
          @click="handleUpload"
        >
          {{ uploadButtonText }}
        </CButton>
      </div>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import FilePondUploader from '@/components/FilePondUploader.vue'
import type { FilePondUploaderInstance } from '@/components/filePondUploader.model.ts'
import type { UploadedFile } from '@/utils/fileUpload'

// Props interface
interface Props {
  open: boolean
  title?: string
  description?: string | null
  allowMultiple?: boolean
  acceptedFileTypes?: string[] | null
  maxFileSize?: string
  maxFiles?: number | null
  supabaseBucket: string
  supabasePath?: string
  supabaseOptions?: {
    cacheControl?: string
    upsert?: boolean
    metadata?: Record<string, unknown>
  }
  fileNamingStrategy?: 'uuid' | 'timestamp' | 'original' | 'custom'
  customFileNamer?: ((file: File, index: number) => string) | null
  allowImagePreview?: boolean
  imagePreviewHeight?: number
  labelIdle?: string
  showUploadButton?: boolean
  uploadButtonText?: string
  uploadingText?: string
  showProgress?: boolean
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  title: 'Upload Files',
  description: null,
  allowMultiple: true,
  acceptedFileTypes: () => [],
  maxFileSize: '10MB',
  maxFiles: null,
  supabasePath: '',
  supabaseOptions: () => ({
    cacheControl: '3600',
    upsert: false,
  }),
  fileNamingStrategy: 'uuid',
  customFileNamer: undefined,
  allowImagePreview: true,
  imagePreviewHeight: 144,
  labelIdle:
    'Drag & Drop your files or <span class="filepond--label-action">Browse</span>',
  showUploadButton: true,
  uploadButtonText: 'Upload Files',
  uploadingText: 'Uploading...',
  showProgress: true,
})

// Emits interface
const emit = defineEmits<{
  close: []
  'upload-success': [urls: string[]]
  /** Same files as `upload-success`, with the storage paths needed to undo them. */
  uploaded: [files: UploadedFile[]]
  'upload-error': [error: unknown]
  'file-added': [file: unknown]
  'file-removed': [file: unknown]
  'file-error': [error: unknown]
}>()

// Reactive data
const hasFiles = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploader = useTemplateRef<FilePondUploaderInstance>('uploader')

// Methods
const handleClose = (): void => {
  if (isUploading.value) {
    return
  }
  emit('close')
  resetState()
}

const handleUpload = async (): Promise<void> => {
  if (!hasFiles.value || isUploading.value || !uploader.value) {
    return
  }

  const uploaded = await uploader.value.upload()

  if (uploaded.length > 0) {
    emit(
      'upload-success',
      uploaded.map((file) => file.url),
    )
    emit('uploaded', uploaded)

    // Close dialog after successful upload
    handleClose()
  }
}

const resetState = (): void => {
  hasFiles.value = false
  isUploading.value = false
  uploadProgress.value = 0

  uploader.value?.reset()
}

// Watchers
watch(
  () => props.open,
  (newValue: boolean) => {
    if (!newValue) {
      resetState()
    }
  },
)

// Expose public methods (required by Vue 3 composition API)
defineExpose({
  resetState,
})
</script>
