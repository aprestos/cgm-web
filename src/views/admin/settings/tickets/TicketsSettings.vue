<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 pb-16">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Tickets Settings
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure ticket sales and management for your convention
      </p>
    </div>

    <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
      <!-- General Ticket Settings -->
      <SettingsSection
        title="General Settings"
        description="Basic ticket configuration options"
      >
        <form @submit="handleSubmit">
          <div
            class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6"
          >
            <div class="sm:col-span-6">
              <div class="flex items-center gap-3">
                <div
                  class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500"
                >
                  <span
                    class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
                  />
                  <input
                    id="enable-online-sales"
                    v-model="formData.enableOnlineSales"
                    type="checkbox"
                    name="enable-online-sales"
                    class="absolute inset-0 appearance-none focus:outline-hidden"
                  />
                </div>
                <div class="text-sm">
                  <label
                    for="enable-online-sales"
                    class="font-medium text-gray-900 dark:text-white cursor-pointer"
                    >Enable Online Sales</label
                  >
                  <p class="text-gray-500 dark:text-gray-400">
                    Allow attendees to purchase tickets online
                  </p>
                </div>
              </div>
            </div>

            <div class="sm:col-span-6">
              <div class="flex items-center gap-3">
                <div
                  class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500"
                >
                  <span
                    class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
                  />
                  <input
                    id="require-verification"
                    v-model="formData.requireVerification"
                    type="checkbox"
                    name="require-verification"
                    class="absolute inset-0 appearance-none focus:outline-hidden"
                  />
                </div>
                <div class="text-sm">
                  <label
                    for="require-verification"
                    class="font-medium text-gray-900 dark:text-white cursor-pointer"
                    >Require Email Verification</label
                  >
                  <p class="text-gray-500 dark:text-gray-400">
                    Require attendees to verify their email before purchase
                  </p>
                </div>
              </div>
            </div>

            <CInput
              id="max-tickets-per-order"
              v-model="formData.maxTicketsPerOrder"
              label="Max Tickets Per Order"
              type="number"
              name="max-tickets-per-order"
              class="sm:col-span-3"
              placeholder="10"
            />

            <CInput
              id="sales-end-hours"
              v-model="formData.salesEndHours"
              label="Stop Sales (hours before event)"
              type="number"
              name="sales-end-hours"
              class="sm:col-span-3"
              placeholder="0"
            />

            <CTextArea
              id="terms-conditions"
              v-model="formData.termsConditions"
              label="Terms & Conditions"
              name="terms-conditions"
              :rows="6"
              class="sm:col-span-6"
              placeholder="Enter your ticket terms and conditions..."
            />
          </div>
        </form>
      </SettingsSection>

      <!-- Payment Settings -->
      <SettingsSection
        title="Payment Settings"
        description="Configure payment processing options"
      >
        <div class="space-y-6">
          <div
            class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800"
          >
            <div class="flex">
              <div class="shrink-0">
                <IconInfoCircle
                  class="h-5 w-5 text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-3">
                <h3
                  class="text-sm font-medium text-blue-800 dark:text-blue-200"
                >
                  Payment Integration
                </h3>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Payment processing will be configured in the Advanced
                    settings section. This includes Stripe, PayPal, and other
                    payment gateways.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <CInput
              id="currency"
              v-model="formData.currency"
              label="Currency"
              name="currency"
              placeholder="EUR"
            />

            <CInput
              id="tax-rate"
              v-model="formData.taxRate"
              label="Tax Rate (%)"
              type="number"
              name="tax-rate"
              placeholder="0"
              step="0.01"
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  </div>
  <SettingsBottomBar :loading="isSaving" @save="saveSettings" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { IconInfoCircle } from '@tabler/icons-vue'
import CInput from '@/components/CInput.vue'
import CTextArea from '@/components/CTextArea.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import logger from '@/lib/logger.ts'

// Form data
const formData = ref({
  enableOnlineSales: true,
  requireVerification: true,
  maxTicketsPerOrder: '10',
  salesEndHours: '0',
  termsConditions: '',
  currency: 'EUR',
  taxRate: '0',
})

const isSaving = ref(false)

// Save settings
const saveSettings = (): void => {
  try {
    isSaving.value = true

    // TODO: Implement actual save to backend
    logger.debug('Saving ticket settings:', { formData: formData.value })

    toast.success('Ticket settings saved successfully!')
  } catch (error) {
    logger.error('Error saving ticket settings:', { error })
    toast.error('Failed to save settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Handle form submit
const handleSubmit = (event: Event): void => {
  event.preventDefault()
  if (isSaving.value) return
  saveSettings()
}
</script>
