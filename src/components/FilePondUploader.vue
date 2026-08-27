<template>
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
</template>

<script setup lang="ts">
import { ref, nextTick, type Ref } from 'vue'
import vueFilePondModule from 'vue-filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { uploadFilesToSupabase } from '@/utils/fileUpload'
import type {
  FileUploadOptions,
  FileNamingOptions,
  UploadedFile,
} from '@/utils/fileUpload'
import logger from '@/lib/logger'

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

interface Props {
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
}

const props = withDefaults(defineProps<Props>(), {
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
})

const emit = defineEmits<{
  'update:hasFiles': [hasFiles: boolean]
  'update:uploading': [uploading: boolean]
  'update:progress': [progress: number]
  'upload-success': [files: UploadedFile[]]
  'upload-error': [error: unknown]
  'file-added': [file: unknown]
  'file-removed': [file: unknown]
  'file-error': [error: unknown]
}>()

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

const pond: Ref<FilePondInstance | null> = ref(null)
const hasFiles = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

const getFiles = (): File[] =>
  pond.value?.getFiles().map((fileItem) => fileItem.file) ?? []

/**
 * Upload the currently selected files to Supabase Storage.
 * Resolves with the files that uploaded successfully — the caller is
 * responsible for removing them again if it never persists their URLs.
 */
const upload = async (): Promise<UploadedFile[]> => {
  const files = getFiles()

  if (files.length === 0 || isUploading.value) {
    return []
  }

  isUploading.value = true
  emit('update:uploading', true)
  setProgress(0)

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
        setProgress(Math.round(progress.progress))
      },
    )

    result.errors.forEach((error) => {
      emit('upload-error', error)
    })

    const uploaded = result.successful.flatMap<UploadedFile>((r) =>
      r.publicUrl ? [{ url: r.publicUrl, path: r.path, bucket: r.bucket }] : [],
    )

    if (uploaded.length > 0) {
      emit('upload-success', uploaded)
    }

    return uploaded
  } catch (error) {
    logger.error('Upload error', { error })
    emit('upload-error', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown upload error',
    })
    return []
  } finally {
    isUploading.value = false
    emit('update:uploading', false)
    setProgress(0)
  }
}

const onAddFile = (error: unknown, file: unknown): void => {
  if (error) {
    logger.error('Add file error', { error })
    emit('file-error', error)
    return
  }

  updateFileState()
  emit('file-added', file)
}

const onRemoveFile = (error: unknown, file: unknown): void => {
  if (error) {
    logger.error('Remove file error', { error })
    return
  }

  updateFileState()
  emit('file-removed', file)
}

const updateFileState = (): void => {
  void nextTick(() => {
    setHasFiles(getFiles().length > 0)
  })
}

const setHasFiles = (value: boolean): void => {
  hasFiles.value = value
  emit('update:hasFiles', value)
}

const setProgress = (value: number): void => {
  uploadProgress.value = value
  emit('update:progress', value)
}

const reset = (): void => {
  setHasFiles(false)
  setProgress(0)

  // Clear FilePond
  pond.value?.removeFiles()
}

// Matches FilePondUploaderInstance — refs are unwrapped on the exposed proxy.
defineExpose({
  upload,
  reset,
  getFiles,
  hasFiles,
  isUploading,
  uploadProgress,
})
</script>

<style scoped>
/* Minimal overrides - let FilePond handle its own styling */
:deep(.filepond--root) {
  margin-bottom: 0;
}
</style>
