import type { UploadedFile } from '@/utils/fileUpload'

/**
 * Shape exposed by `FilePondUploader.vue` through a template ref.
 * Lives outside the SFC so consumers can import it with full type information.
 */
export interface FilePondUploaderInstance {
  /**
   * Uploads the selected files and resolves with the ones that reached storage.
   * The caller owns the result: if whatever the files belong to is never
   * persisted, pass them to `deleteUploadedFiles` to avoid orphans.
   */
  upload: () => Promise<UploadedFile[]>
  /** Clears the selection and resets progress. */
  reset: () => void
  getFiles: () => File[]
  hasFiles: boolean
  isUploading: boolean
  uploadProgress: number
}
