<template>
  <SettingsSection
    title="Branding"
    description="Manage your organization's logo and image gallery"
  >
    <form @submit="handleSubmit">
      <!-- Logo Upload -->
      <div class="mb-8">
        <label
          class="block text-sm font-medium text-gray-900 dark:text-white mb-4"
        >
          Organization Logo
        </label>
        <div class="flex items-center gap-x-8">
          <img
            :src="logoUrl || tenantStore?.logo || '@/assets/logoipsum-381.svg'"
            alt="Organization logo"
            class="size-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div>
            <CButton
              type="button"
              variant="secondary"
              @click="showUploadDialog = true"
            >
              Change Logo
            </CButton>
            <p class="mt-2 text-sm text-gray-500">
              JPG, PNG, GIF or WebP. Max file size: 5MB.
            </p>
            <FilePondUploadDialog
              :open="showUploadDialog"
              title="Upload Logo"
              description="Select a logo image for your organization (max 5MB)"
              :allow-multiple="false"
              :accepted-file-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
              ]"
              max-file-size="5MB"
              :max-files="1"
              supabase-bucket="images"
              :supabase-path="logoFolder"
              file-naming-strategy="uuid"
              :supabase-options="{
                cacheControl: '31536000',
                upsert: false,
              }"
              @close="showUploadDialog = false"
              @upload-success="handleLogoUploadSuccess"
              @upload-error="handleLogoUploadError"
            />
          </div>
        </div>
      </div>

      <!-- Image Gallery Section -->
      <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="mb-6">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
            Image Gallery
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload and manage images for your organization
          </p>
        </div>

        <div class="space-y-6">
          <!-- Upload Button -->
          <div>
            <CButton
              type="button"
              variant="secondary"
              @click="showImageUploadDialog = true"
            >
              Upload Images
            </CButton>
            <p class="mt-2 text-sm text-gray-500">
              JPG, PNG, GIF or WebP. Max 10 images, 5MB each.
            </p>
            <FilePondUploadDialog
              :open="showImageUploadDialog"
              title="Upload Images"
              description="Select images to add to your gallery (max 10 images, 5MB each)"
              :allow-multiple="true"
              :accepted-file-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
              ]"
              max-file-size="5MB"
              :max-files="10"
              supabase-bucket="images"
              :supabase-path="imagesFolder"
              file-naming-strategy="uuid"
              :supabase-options="{
                cacheControl: '31536000',
                upsert: false,
              }"
              @close="showImageUploadDialog = false"
              @upload-success="handleImagesUploadSuccess"
              @upload-error="handleImagesUploadError"
            />
          </div>

          <!-- Image Grid -->
          <div
            v-if="uploadedImages.length > 0"
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            <div
              v-for="(image, index) in uploadedImages"
              :key="index"
              class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <img
                :src="image"
                :alt="`Gallery image ${index + 1}`"
                class="h-full w-full object-cover"
              />
              <button
                type="button"
                class="absolute top-2 right-2 rounded-md bg-red-600 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700 focus:opacity-100"
                @click="removeImage(index)"
              >
                <span class="sr-only">Remove image</span>
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 py-12"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No images uploaded yet
            </p>
          </div>
        </div>
      </div>
    </form>
  </SettingsSection>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import FilePondUploadDialog from '@/components/FilePondUploadDialog.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import tenantService from '@/features/tenant/service.ts'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'

// Logo state
const logoUrl = ref(tenantStore.value?.logo)
const showUploadDialog = ref(false)

// Image gallery state
const uploadedImages = ref<string[]>([])
const showImageUploadDialog = ref(false)
const isSaving = ref(false)

// Computed folder paths
const logoFolder = computed((): string => {
  const tenantId = tenantStore.value?.id
  return tenantId ? `tenants/${tenantId}/logos` : 'tenants/default/logos'
})

const imagesFolder = computed((): string => {
  const tenantId = tenantStore.value?.id
  return tenantId ? `tenants/${tenantId}/images` : 'tenants/default/images'
})

// Initialize data
watchEffect((): void => {
  if (tenantStore.value) {
    logoUrl.value = tenantStore.value.logo || logoUrl.value
    uploadedImages.value = tenantStore.value.images || []
  }
})

// Handle image load/error events
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  logger.error('Image failed to load:', {
    src: img.src,
    error: event,
  })
}

const handleImageLoad = (event: Event): void => {
  const img = event.target as HTMLImageElement
  logger.debug('Image loaded successfully:', {
    src: img.src,
  })
}

// Handle logo upload
const handleLogoUploadSuccess = (urls: string[]): void => {
  showUploadDialog.value = false
  const url = urls[0]
  if (url) {
    logoUrl.value = url
    logger.debug('Logo uploaded successfully:', { url })
    toast.success('Logo uploaded successfully!')
  }
}

const handleLogoUploadError = (error: unknown): void => {
  logger.error('Logo upload failed:', { error })
  toast.error('Failed to upload logo. Please try again.')
}

// Handle image gallery upload
const handleImagesUploadSuccess = (urls: string[]): void => {
  showImageUploadDialog.value = false
  uploadedImages.value = [...uploadedImages.value, ...urls]
  logger.debug('Images uploaded successfully:', { urls })
  toast.success(`${urls.length} image(s) uploaded successfully!`)
}

const handleImagesUploadError = (error: unknown): void => {
  logger.error('Images upload failed:', { error })
  toast.error('Failed to upload images. Please try again.')
}

// Remove image from gallery
const removeImage = (index: number): void => {
  uploadedImages.value = uploadedImages.value.filter((_, i) => i !== index)
  toast.success('Image removed from gallery')
}

// Save branding
const saveBranding = async (): Promise<void> => {
  try {
    const tenantId = tenantStore.value?.id
    if (!tenantId) {
      logger.error('No tenant ID found')
      toast.error('No tenant ID found. Please refresh and try again.')
      return
    }

    isSaving.value = true

    const updates: {
      logo?: string
      images?: string[]
    } = {}

    if (logoUrl.value && logoUrl.value !== tenantStore.value?.logo) {
      updates.logo = logoUrl.value
    }

    if (uploadedImages.value && uploadedImages.value.length > 0) {
      updates.images = uploadedImages.value
    }

    // Save to database
    const updatedTenant = await tenantService.updateTenant(tenantId, updates)

    if (updatedTenant) {
      logger.debug('Branding saved successfully:', { updatedTenant })

      // Update the tenant store
      if (tenantStore.value) {
        tenantStore.value = { ...tenantStore.value, ...updatedTenant }
      }

      toast.success('Branding settings saved successfully!')
    } else {
      logger.error('Failed to save branding settings')
      toast.error('Failed to save settings. Please try again.')
    }
  } catch (error) {
    logger.error('Error saving branding:', { error })
    toast.error('An error occurred while saving. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Handle form submit
const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()

  if (isSaving.value) return

  await saveBranding()
}

defineExpose({ save: saveBranding, isSaving })
</script>
