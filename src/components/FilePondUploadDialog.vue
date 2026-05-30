<template>
  <DialogComponent :open="open" :title="title" @close="handleClose">
    <div class="space-y-4">
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <file-pond
        ref="pond"
        class="w-full"
        :allow-multiple="allowMultiple"
        :accepted-file-types="acceptedFileTypes"
        :max-file-size="maxFileSize"
        :max-files="maxFiles"
        :label-idle="labelIdle"
        :allow-image-preview="allowImagePreview"
        :image-preview-height="imagePreviewHeight"
        :server="null"
        @addfile="onAddFile"
        @removefile="onRemoveFile"
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
import { ref, nextTick, watch, type Ref } from 'vue'
import vueFilePondModule from 'vue-filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { uploadFilesToSupabase } from '@/utils/fileUpload'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import type { FileUploadOptions, FileNamingOptions } from '@/utils/fileUpload'

// Import FilePond styles
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'

interface VueFilePondFactory {
  (...plugins: unknown[]): unknown
}

const resolveVueFilePondFactory = (): VueFilePondFactory => {
  const moduleWithDefault = vueFilePondModule as { default?: unknown }
  const maybeFactory = moduleWithDefault.default ?? vueFilePondModule

  if (typeof maybeFactory !== 'function') {
    throw new TypeError('Invalid vue-filepond module export')
  }

  return maybeFactory as VueFilePondFactory
}

// Create FilePond component
const FilePond = resolveVueFilePondFactory()(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImagePreview,
)

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
  'upload-error': [error: unknown]
  'file-added': [file: unknown]
  'file-removed': [file: unknown]
  'file-error': [error: unknown]
}>()

// Reactive data
const hasFiles = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const pond: Ref<FilePondInstance | null> = ref(null)

// FilePond file item interface
interface FilePondFileItem {
  file: File
  getFiles(): FilePondFileItem[]
}

// FilePond instance interface
interface FilePondInstance {
  getFiles(): FilePondFileItem[]
  removeFiles(): void
}

// Methods
const handleClose = (): void => {
  if (isUploading.value) {
    return
  }
  emit('close')
  resetState()
}

const handleUpload = (): void => {
  if (!hasFiles.value || isUploading.value || !pond.value) {
    return
  }

  const files = pond.value.getFiles().map((fileItem) => fileItem.file)
  void uploadFiles(files)
}

const uploadFiles = async (files: File[]): Promise<void> => {
  if (files.length === 0) {
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const uploadOptions: FileUploadOptions = {
      bucket: props.supabaseBucket,
      path: props.supabasePath,
      ...props.supabaseOptions,
    }

    const namingOptions: FileNamingOptions = {
      strategy: props.fileNamingStrategy,
      customNamer: props.customFileNamer || undefined,
    }

    const result = await uploadFilesToSupabase(
      files,
      uploadOptions,
      namingOptions,
      (progress) => {
        uploadProgress.value = Math.round(progress.progress)
      },
    )

    // Handle errors
    if (result.errors.length > 0) {
      result.errors.forEach((error) => {
        emit('upload-error', error)
      })
    }

    // Emit success with URLs
    if (result.successful.length > 0) {
      const urls = result.successful
        .map((r) => r.publicUrl)
        .filter(Boolean) as string[]

      emit('upload-success', urls)

      // Close dialog after successful upload
      handleClose()
    }
  } catch (error) {
    console.error('Upload error:', error)
    emit('upload-error', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown upload error',
    })
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const onAddFile = (error: unknown, file: unknown): void => {
  if (error) {
    console.error('Add file error:', error)
    emit('file-error', error)
    return
  }

  updateFileState()
  emit('file-added', file)
}

const onRemoveFile = (error: unknown, file: unknown): void => {
  if (error) {
    console.error('Remove file error:', error)
    return
  }

  updateFileState()
  emit('file-removed', file)
}

const updateFileState = (): void => {
  void nextTick(() => {
    if (!pond.value) {
      hasFiles.value = false
      return
    }

    const files = pond.value.getFiles() || []
    hasFiles.value = files.length > 0
  })
}

const resetState = (): void => {
  hasFiles.value = false
  isUploading.value = false
  uploadProgress.value = 0

  // Clear FilePond
  if (pond.value) {
    pond.value.removeFiles()
  }
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

<style scoped>
/* Minimal overrides - let FilePond handle its own styling */
:deep(.filepond--root) {
  margin-bottom: 0;
}
</style>
