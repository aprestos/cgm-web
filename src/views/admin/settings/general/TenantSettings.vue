<template>
  <SettingsSection
    title="Organizer Information"
    description="Manage your organization's basic information including name, contact details and logo"
  >
    <form @submit="handleSubmit">
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <div class="col-span-full">
          <div class="flex items-center gap-x-8">
            <img
              :src="
                logoUrl || tenantStore?.logo || '@/assets/logoipsum-381.svg'
              "
              alt="Organization logo"
              class="size-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <div>
              <CButton variant="secondary" @click="showUploadDialog = true">
                Change logo
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

        <CInput
          id="tenant-name"
          v-model="formData.name"
          label="Name"
          name="tenant-name"
          :errors="r$.$errors.name"
        />

        <CInput
          id="tenant-short-description"
          v-model="formData.shortDescription"
          label="Short description"
          name="tenant-short-description"
          :errors="r$.$errors.shortDescription"
        />

        <CInput
          id="email"
          v-model="formData.email"
          label="Email address"
          type="email"
          name="email"
          :errors="
            r$.$errors.email.length > 0
              ? [r$.$errors.email[0] ?? '']
              : undefined
          "
        />
      </div>

      <!-- Image Gallery Section -->
      <div class="mt-10 pt-10 dark:border-gray-700">
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
            <CButton variant="secondary" @click="showImageUploadDialog = true">
              Upload Images
            </CButton>
            <p class="mt-2 text-sm text-gray-500">
              Upload multiple images (JPG, PNG, GIF or WebP). Max 5MB per file.
            </p>
          </div>

          <!-- Image Gallery -->
          <div
            v-if="uploadedImages.length > 0"
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            <div
              v-for="(imageUrl, index) in uploadedImages"
              :key="index"
              class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <img
                :src="imageUrl"
                :alt="`Uploaded image ${index + 1}`"
                class="h-full w-full object-cover"
              />
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <CButton
                  variant="secondary"
                  size="sm"
                  @click="removeImage(index)"
                >
                  Remove
                </CButton>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3
              class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              No images uploaded
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by uploading your first image.
            </p>
          </div>

          <!-- Upload Dialog -->
          <FilePondUploadDialog
            :open="showImageUploadDialog"
            title="Upload Images"
            description="Select one or more images to upload (max 5MB per file)"
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
      </div>
      <div class="mt-8 flex">
        <CButton type="submit" :loading="isSaving" loading-text="Saving...">
          Save
        </CButton>
      </div>
    </form>
  </SettingsSection>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core'
import {
  alpha,
  string,
  email,
  maxLength,
  minLength,
  required,
} from '@regle/rules'
import { computed, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
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

// Computed folder path with actual tenant ID
const logoFolder = computed((): string => {
  const tenantId = tenantStore.value?.id
  return tenantId ? `tenants/${tenantId}/logos` : 'tenants/default/logos'
})

// Computed folder path for image gallery
const imagesFolder = computed((): string => {
  const tenantId = tenantStore.value?.id
  return tenantId ? `tenants/${tenantId}/images` : 'tenants/default/images'
})

// Handle image load/error events for debugging
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  logger.error('Image failed to load:', {
    src: img.src,
    logoUrl: logoUrl.value,
    tenantStoreLogo: tenantStore.value?.logo,
    error: event,
  })
}

const handleImageLoad = (event: Event): void => {
  const img = event.target as HTMLImageElement
  logger.debug('Image loaded successfully:', {
    src: img.src,
    logoUrl: logoUrl.value,
    tenantStoreLogo: tenantStore.value?.logo,
  })
}

// Handle logo upload success
const handleLogoUploadSuccess = (urls: string[]): void => {
  showUploadDialog.value = false
  const url = urls[0]
  if (url) {
    logoUrl.value = url
    logger.debug('Logo uploaded successfully:', { url })
    toast.success('Logo uploaded successfully!')
  }
}

// Handle logo upload error
const handleLogoUploadError = (error: unknown): void => {
  logger.error('Logo upload failed:', { error })
  toast.error('Failed to upload logo. Please try again.')
}

// Handle image gallery upload success
const handleImagesUploadSuccess = (urls: string[]): void => {
  showImageUploadDialog.value = false
  uploadedImages.value = [...uploadedImages.value, ...urls]
  logger.debug('Images uploaded successfully:', { urls })
  toast.success(`${urls.length} image(s) uploaded successfully!`)
}

// Handle image gallery upload error
const handleImagesUploadError = (error: unknown): void => {
  logger.error('Images upload failed:', { error })
  toast.error('Failed to upload images. Please try again.')
}

// Remove image from gallery
const removeImage = (index: number): void => {
  uploadedImages.value = uploadedImages.value.filter((_, i) => i !== index)
  toast.success('Image removed from gallery')
}

// Form data
const formData = ref({
  name: '',
  email: '',
  shortDescription: '',
})

// Regle validation setup
const { r$ } = useRegle(formData, {
  name: {
    required,
    alpha,
    minLength: minLength(2),
    maxLength: maxLength(50),
  },
  email: {
    required,
    email,
  },
  shortDescription: {
    string,
    minLength: minLength(10),
    maxLength: maxLength(200),
  },
})

// Loading state for save operation
const isSaving = ref(false)

// Initialize form data with current tenant data
const initializeFormData = (): void => {
  if (tenantStore.value) {
    formData.value.name = tenantStore.value.name || ''
    formData.value.email = tenantStore.value.email || ''
    formData.value.shortDescription = tenantStore.value.short_description || ''
    logoUrl.value = tenantStore.value.logo || logoUrl.value
    uploadedImages.value = tenantStore.value.images || []
  }
}

// Initialize form when component mounts or tenant changes
watchEffect((): void => {
  if (tenantStore.value) {
    initializeFormData()
  }
})

// Save tenant function
const saveTenant = async (): Promise<void> => {
  try {
    const tenantId = tenantStore.value?.id
    if (!tenantId) {
      console.error('No tenant ID found')
      toast.error('No tenant ID found. Please refresh and try again.')
      return
    }

    isSaving.value = true

    // Prepare updates - only include defined values
    const updates: {
      name?: string
      email?: string
      short_description?: string
      logo?: string
      images?: string[]
    } = {}

    if (formData.value.name.trim()) {
      updates.name = formData.value.name.trim()
    }

    if (formData.value.email.trim()) {
      updates.email = formData.value.email.trim()
    }

    if (formData.value.shortDescription.trim()) {
      updates.short_description = formData.value.shortDescription.trim()
    }

    if (logoUrl.value && logoUrl.value !== tenantStore.value?.logo) {
      updates.logo = logoUrl.value
    }

    if (uploadedImages.value && uploadedImages.value.length > 0) {
      updates.images = uploadedImages.value
    }

    // Save to database
    const updatedTenant = await tenantService.updateTenant(tenantId, updates)

    if (updatedTenant) {
      logger.debug('Tenant saved successfully:', { updatedTenant })

      // Update the tenant store with the new data
      if (tenantStore.value) {
        tenantStore.value = { ...tenantStore.value, ...updatedTenant }
      }

      toast.success('Organization settings saved successfully!')
    } else {
      logger.error('Failed to save tenant settings')
      toast.error('Failed to save settings. Please try again.')
    }
  } catch (error) {
    console.error('Error saving tenant:', error)
    toast.error('An error occurred while saving. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Handle form submit
const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()

  if (isSaving.value) return

  // Validate form before submitting
  const { valid } = await r$.$validate()

  if (!valid) {
    logger.debug('Form has validation errors')
    return
  }

  await saveTenant()
}
</script>
