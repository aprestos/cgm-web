import { supabase } from '@/lib/supabase'
import { authService } from '@/features/auth/service.ts'
import logger from '@/lib/logger'

export interface FileUploadOptions {
  bucket: string
  path?: string
  cacheControl?: string
  upsert?: boolean
  metadata?: Record<string, any>
}

export interface FileNamingOptions {
  strategy: 'uuid' | 'timestamp' | 'original' | 'custom'
  customNamer?: (file: File, index: number) => string
}

export interface UploadResult {
  originalFile: File
  supabaseData: any
  publicUrl: string | null
  path: string
  bucket: string
  error?: any
}

/**
 * A file that reached storage. Keeps the path alongside the public URL so the
 * upload can be rolled back when whatever it belonged to never got persisted.
 */
export interface UploadedFile {
  url: string
  path: string
  bucket: string
}

export interface UploadProgress {
  fileIndex: number
  fileName: string
  progress: number
  completed: boolean
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate filename based on naming strategy
 */
export function generateFileName(
  file: File,
  index: number,
  options: FileNamingOptions,
): string {
  const fileExtension = file.name.split('.').pop()

  switch (options.strategy) {
    case 'uuid':
      return `${generateUUID()}.${fileExtension}`
    case 'timestamp':
      return `${Date.now()}_${index}.${fileExtension}`
    case 'original':
      return file.name
    case 'custom':
      if (options.customNamer && typeof options.customNamer === 'function') {
        return options.customNamer(file, index)
      }
      // Fallback to timestamp if custom function is not provided
      return `${Date.now()}_${index}.${fileExtension}`
    default:
      return `${generateUUID()}.${fileExtension}`
  }
}

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFileToSupabase(
  file: File,
  fileName: string,
  options: FileUploadOptions,
): Promise<UploadResult> {
  const filePath = options.path ? `${options.path}/${fileName}` : fileName

  try {
    // Check authentication first
    const user = await authService.getUser()
    if (!user) {
      return {
        originalFile: file,
        supabaseData: null,
        publicUrl: null,
        path: filePath,
        bucket: options.bucket,
        error: new Error(
          'User not authenticated. Please log in to upload files.',
        ),
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      return {
        originalFile: file,
        supabaseData: null,
        publicUrl: null,
        path: filePath,
        bucket: options.bucket,
        error: error,
      }
    }

    // Get public URL (works for both public and private buckets)
    const { data: publicUrlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath)

    return {
      originalFile: file,
      supabaseData: data,
      publicUrl: publicUrlData?.publicUrl || null,
      path: filePath,
      bucket: options.bucket,
    }
  } catch (error) {
    return {
      originalFile: file,
      supabaseData: null,
      publicUrl: null,
      path: filePath,
      bucket: options.bucket,
      error: error,
    }
  }
}

/**
 * Upload multiple files to Supabase Storage with progress tracking
 */
export async function uploadFilesToSupabase(
  files: File[],
  uploadOptions: FileUploadOptions,
  namingOptions: FileNamingOptions,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{
  successful: UploadResult[]
  failed: UploadResult[]
  errors: any[]
}> {
  const successful: UploadResult[] = []
  const failed: UploadResult[] = []
  const errors: any[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (!file) continue

    // Generate filename
    const fileName = generateFileName(file, i, namingOptions)

    // Report progress
    if (onProgress) {
      onProgress({
        fileIndex: i,
        fileName: file.name,
        progress: (i / files.length) * 100,
        completed: false,
      })
    }

    try {
      const result = await uploadFileToSupabase(file, fileName, uploadOptions)

      if (result.error) {
        failed.push(result)
        errors.push({
          file: file.name,
          error: result.error,
          message: result.error.message || 'Upload failed', //eslint-disable-line
        })
      } else {
        successful.push(result)
      }
    } catch (error) {
      const failedResult: UploadResult = {
        originalFile: file,
        supabaseData: null,
        publicUrl: null,
        path: fileName,
        bucket: uploadOptions.bucket,
        error: error,
      }

      failed.push(failedResult)
      errors.push({
        file: file.name,
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Report completion for this file
    if (onProgress) {
      onProgress({
        fileIndex: i,
        fileName: file.name,
        progress: ((i + 1) / files.length) * 100,
        completed: true,
      })
    }
  }

  return { successful, failed, errors }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromSupabase(
  filePath: string,
  bucket: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Remove uploads that were never persisted. Best effort: failures are logged
 * rather than thrown, since the caller is already handling another error.
 */
export async function deleteUploadedFiles(
  files: UploadedFile[],
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const { success, error } = await deleteFileFromSupabase(
        file.path,
        file.bucket,
      )

      if (!success) {
        logger.error('Unable to delete orphaned upload', {
          error,
          path: file.path,
          bucket: file.bucket,
        })
      }
    }),
  )
}

/**
 * The storage path behind a public URL, so a file that is being replaced can
 * be cleaned up along with it. Returns null for anything that is not a public
 * URL of this bucket — an externally hosted image, or a hand-edited value.
 */
export function storagePathFromPublicUrl(
  url: string,
  bucket: string,
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null

  const path = url.slice(index + marker.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(
  filePath: string,
  bucket: string,
  expiresIn: number = 3600,
): Promise<{ url: string | null; error?: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      return { url: null, error }
    }

    return { url: data.signedUrl }
  } catch (error) {
    return { url: null, error }
  }
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder?: string,
): Promise<{ files: any[] | null; error?: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '', {
        limit: 100,
        offset: 0,
      })

    if (error) {
      return { files: null, error }
    }

    return { files: data || [] }
  } catch (error) {
    return { files: null, error }
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  filePath: string,
  bucket: string,
  //eslint-disable-next-line
): Promise<{ metadata: any | null; error?: any }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      search: filePath,
    })

    if (error) {
      return { metadata: null, error }
    }

    const file = data?.find((f) => f.name === filePath)
    return { metadata: file || null }
  } catch (error) {
    return { metadata: null, error }
  }
}

// Export default object with all functions
export default {
  generateFileName,
  uploadFileToSupabase,
  uploadFilesToSupabase,
  deleteFileFromSupabase,
  deleteUploadedFiles,
  getSignedUrl,
  listFiles,
  getFileMetadata,
}
