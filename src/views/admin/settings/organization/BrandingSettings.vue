<template>
  <SettingsSection
    title="Branding"
    description="Manage your organization's logos and image gallery"
  >
    <form class="space-y-10" @submit="handleSubmit">
      <!-- Logos Section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Logos
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Square Logo Card -->
          <div
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 flex flex-col gap-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Square Logo
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Used for avatars, favicons, and compact contexts
              </p>
            </div>
            <div
              class="flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 aspect-square w-full max-w-[140px] mx-auto overflow-hidden"
            >
              <img
                v-if="squareLogoUrl"
                :src="squareLogoUrl"
                alt="Square logo"
                class="h-full w-full object-contain p-3"
                @error="handleImageError"
              />
              <span
                v-else
                class="text-xs text-gray-400 dark:text-gray-500 text-center px-2"
                >No logo</span
              >
            </div>
            <CButton
              type="button"
              variant="secondary"
              class="w-full justify-center"
              @click="showSquareUploadDialog = true"
            >
              {{ squareLogoUrl ? 'Change' : 'Upload' }} Square Logo
            </CButton>
            <FilePondUploadDialog
              :open="showSquareUploadDialog"
              title="Upload Square Logo"
              description="Best results with a square image (e.g. 512×512px). Max 5MB."
              :allow-multiple="false"
              :accepted-file-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/svg+xml',
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
              @close="showSquareUploadDialog = false"
              @upload-success="handleSquareLogoUpload"
              @upload-error="handleLogoUploadError"
            />
          </div>

          <!-- Long / Horizontal Logo Card -->
          <div
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 flex flex-col gap-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Horizontal Logo
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Used in headers, navigation bars, and wide layouts
              </p>
            </div>
            <div
              class="flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 aspect-[3/1] w-full overflow-hidden"
            >
              <img
                v-if="longLogoUrl"
                :src="longLogoUrl"
                alt="Horizontal logo"
                class="h-full w-full object-contain p-3"
                @error="handleImageError"
              />
              <span
                v-else
                class="text-xs text-gray-400 dark:text-gray-500 text-center px-4"
                >No logo</span
              >
            </div>
            <CButton
              type="button"
              variant="secondary"
              class="w-full justify-center"
              @click="showLongUploadDialog = true"
            >
              {{ longLogoUrl ? 'Change' : 'Upload' }} Horizontal Logo
            </CButton>
            <FilePondUploadDialog
              :open="showLongUploadDialog"
              title="Upload Horizontal Logo"
              description="Best results with a wide image (e.g. 1200×400px). Max 5MB."
              :allow-multiple="false"
              :accepted-file-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/svg+xml',
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
              @close="showLongUploadDialog = false"
              @upload-success="handleLongLogoUpload"
              @upload-error="handleLogoUploadError"
            />
          </div>
        </div>
      </div>

      <!-- Image Gallery Section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Image Gallery
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Supplementary images for your organization
            </p>
          </div>
          <CButton
            type="button"
            variant="secondary"
            @click="showImageUploadDialog = true"
          >
            Upload Images
          </CButton>
        </div>

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

        <!-- Image Grid -->
        <div
          v-if="uploadedImages.length > 0"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <div
            v-for="(image, index) in uploadedImages"
            :key="index"
            class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
          class="text-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-12"
        >
          <svg
            class="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No images uploaded yet
          </p>
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
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'

// Logo state
const squareLogoUrl = ref<string | undefined>(tenantStore.value?.logos?.square)
const longLogoUrl = ref<string | undefined>(tenantStore.value?.logos?.long)
const showSquareUploadDialog = ref(false)
const showLongUploadDialog = ref(false)

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

// Initialize from store
watchEffect((): void => {
  if (tenantStore.value) {
    squareLogoUrl.value =
      tenantStore.value.logos?.square ?? tenantStore.value.logo
    longLogoUrl.value = tenantStore.value.logos?.long
    uploadedImages.value = tenantStore.value.images ?? []
  }
})

// Handle image error
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  logger.error('Image failed to load:', { src: img.src, error: event })
}

// Logo upload handlers
const handleSquareLogoUpload = (urls: string[]): void => {
  showSquareUploadDialog.value = false
  const url = urls[0]
  if (url) {
    squareLogoUrl.value = url
    toast.success('Square logo uploaded!')
  }
}

const handleLongLogoUpload = (urls: string[]): void => {
  showLongUploadDialog.value = false
  const url = urls[0]
  if (url) {
    longLogoUrl.value = url
    toast.success('Horizontal logo uploaded!')
  }
}

const handleLogoUploadError = (error: unknown): void => {
  logger.error('Logo upload failed:', { error })
  toast.error('Failed to upload logo. Please try again.')
}

// Image gallery handlers
const handleImagesUploadSuccess = (urls: string[]): void => {
  showImageUploadDialog.value = false
  uploadedImages.value = [...uploadedImages.value, ...urls]
  toast.success(`${urls.length} image(s) uploaded successfully!`)
}

const handleImagesUploadError = (error: unknown): void => {
  logger.error('Images upload failed:', { error })
  toast.error('Failed to upload images. Please try again.')
}

const removeImage = (index: number): void => {
  uploadedImages.value = uploadedImages.value.filter((_, i) => i !== index)
  toast.success('Image removed from gallery')
}

// Save branding
const saveBranding = async (): Promise<void> => {
  const tenantId = tenantStore.value?.id
  if (!tenantId) {
    toast.error('No tenant ID found. Please refresh and try again.')
    return
  }

  isSaving.value = true

  try {
    const existingLogos: Partial<Record<LogoType, string | undefined>> =
      tenantStore.value?.logos ?? {}
    const updatedLogos: Partial<Record<LogoType, string | undefined>> = {
      ...existingLogos,
      ...(squareLogoUrl.value
        ? { [LogoType.square]: squareLogoUrl.value }
        : {}),
      ...(longLogoUrl.value ? { [LogoType.long]: longLogoUrl.value } : {}),
    }

    const updates: {
      logos?: typeof updatedLogos
      images?: string[]
    } = {}

    if (Object.keys(updatedLogos).length > 0) {
      updates.logos = updatedLogos
    }

    if (uploadedImages.value.length > 0) {
      updates.images = uploadedImages.value
    }

    const updatedTenant = await tenantService.updateTenant(tenantId, updates)

    if (updatedTenant) {
      if (tenantStore.value) {
        tenantStore.value = { ...tenantStore.value, ...updatedTenant }
      }
      toast.success('Branding saved successfully!')
    } else {
      toast.error('Failed to save settings. Please try again.')
    }
  } catch (error) {
    logger.error('Error saving branding:', { error })
    toast.error('An error occurred while saving. Please try again.')
  } finally {
    isSaving.value = false
  }
}

const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()
  if (isSaving.value) return

  await saveBranding()
}

defineExpose({ save: saveBranding, isSaving })
</script>
