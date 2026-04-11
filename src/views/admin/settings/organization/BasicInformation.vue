<template>
  <SettingsSection
    title="Basic Information"
    description="Manage your organization's basic information including name and contact details"
  >
    <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
      <CInput
        id="tenant-name"
        v-model="formData.name"
        label="Organization Name"
        name="tenant-name"
        class="sm:col-span-6"
        :errors="r$.$errors.name"
      />

      <CInput
        id="tenant-short-description"
        v-model="formData.shortDescription"
        label="Short Description"
        name="tenant-short-description"
        class="sm:col-span-6"
        :errors="r$.$errors.shortDescription"
      />

      <CInput
        id="email"
        v-model="formData.email"
        label="Email Address"
        type="email"
        name="email"
        class="sm:col-span-6"
        :errors="
          r$.$errors.email.length > 0 ? [r$.$errors.email[0] ?? ''] : undefined
        "
      />
    </div>
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
import { ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import CInput from '@/components/CInput.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import tenantService from '@/features/tenant/service.ts'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'

export interface BasicInformationForm {
  name: string
  email: string
  shortDescription: string
}

// Form data
const formData = ref<BasicInformationForm>({
  name: '',
  email: '',
  shortDescription: '',
})

// Track initial values for comparison
const initialValues = ref({
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
    formData.value.shortDescription = tenantStore.value.shortDescription || ''

    // Store initial values
    initialValues.value = {
      name: formData.value.name,
      email: formData.value.email,
      shortDescription: formData.value.shortDescription,
    }
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
    // Validate form first
    const { valid } = await r$.$validate()

    if (!valid) {
      logger.debug('Form has validation errors')
      toast.error('Please fix validation errors before saving.')
      return
    }

    const tenantId = tenantStore.value?.id
    if (!tenantId) {
      logger.error('No tenant ID found')
      toast.error('No tenant ID found. Please refresh and try again.')
      return
    }

    isSaving.value = true

    // Prepare updates
    const updates: {
      name?: string
      email?: string
      short_description?: string
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

    // Save to database
    const updatedTenant = await tenantService.updateTenant(tenantId, updates)

    if (updatedTenant) {
      logger.debug('Tenant basic information saved successfully:', {
        updatedTenant,
      })

      // Update the tenant store
      if (tenantStore.value) {
        tenantStore.value = { ...tenantStore.value, ...updatedTenant }
      }

      // Update initial values after successful save
      initialValues.value = {
        name: formData.value.name,
        email: formData.value.email,
        shortDescription: formData.value.shortDescription,
      }

      toast.success('Basic information saved successfully!')
    } else {
      logger.error('Failed to save tenant settings')
      toast.error('Failed to save settings. Please try again.')
    }
  } catch (error) {
    logger.error('Error saving tenant:', { error })
    toast.error('An error occurred while saving. Please try again.')
  } finally {
    isSaving.value = false
  }
}

defineExpose({ save: saveTenant, isSaving })
</script>
