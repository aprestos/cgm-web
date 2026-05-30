<template>
  <SettingsSection
    title="Integrations"
    description="Connect external services and APIs to enhance your platform"
  >
    <div class="space-y-8">
      <!-- BoardGameGeek Integration -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30"
            >
              <IconBrandGoogle
                class="h-6 w-6 text-orange-600 dark:text-orange-400"
              />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                BoardGameGeek API
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Import game data automatically from BGG
              </p>
            </div>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20"
          >
            <IconCheck class="mr-1 h-3 w-3" aria-hidden="true" />
            Active
          </span>
        </div>
        <div class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            The BoardGameGeek integration is enabled and working. Game data will
            be automatically fetched when importing games by BGG ID.
          </p>
        </div>
      </div>

      <!-- Email Service Integration -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
            >
              <IconMail class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Email Service
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Send notifications and confirmations via email
              </p>
            </div>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20"
          >
            <IconAlertCircle class="mr-1 h-3 w-3" aria-hidden="true" />
            Not Configured
          </span>
        </div>
        <div class="mt-4 space-y-4">
          <CInput
            id="smtp-host"
            v-model="emailConfig.smtpHost"
            label="SMTP Host"
            placeholder="smtp.example.com"
          />
          <div class="grid grid-cols-2 gap-4">
            <CInput
              id="smtp-port"
              v-model="emailConfig.smtpPort"
              label="SMTP Port"
              placeholder="587"
            />
            <CInput
              id="smtp-user"
              v-model="emailConfig.smtpUser"
              label="SMTP Username"
              placeholder="user@example.com"
            />
          </div>
          <CButton type="button" variant="secondary" @click="saveEmailConfig">
            Save Email Configuration
          </CButton>
        </div>
      </div>

      <!-- Payment Gateways -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"
            >
              <IconCreditCard
                class="h-6 w-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Payment Gateways
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure Stripe, PayPal, or other payment processors
              </p>
            </div>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20"
          >
            <IconAlertCircle class="mr-1 h-3 w-3" aria-hidden="true" />
            Not Configured
          </span>
        </div>
        <div class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Payment gateway integration is available for ticket sales and flea
            market transactions. Configure your preferred payment processor to
            enable online payments.
          </p>
          <div
            class="flex flex-row justify-between items-center mt-3 text-gray-700 dark:text-white/70"
          >
            <div class="flex flex-row gap-3">
              <div class="flex flex-row gap-1">
                <IconBrandStripe />
                <div class="flex flex-col">
                  <span>Stripe</span>
                </div>
              </div>
              <CBadge
                v-if="stripeConfiguration?.onboardingStatus === 'pending'"
                text="Incomplete"
                type="yellow"
                size="sm"
                >Incomplete</CBadge
              >
              <CBadge
                v-else-if="stripeConfiguration?.onboardingStatus === 'complete'"
                size="sm"
                type="green"
                ><IconCircleCheck class="mr-2" size="14" />Active</CBadge
              >
              <CBadge v-else type="gray">Not started</CBadge>
            </div>
            <CButton
              v-if="stripeConfiguration?.onboardingStatus !== 'complete'"
              type="button"
              size="sm"
              variant="secondary"
              @click="() => openDialog('connect-stripe')"
              >Connect</CButton
            >
            <CButton
              v-else
              type="button"
              size="sm"
              variant="secondary"
              @click="() => openDialog('disconnect-stripe')"
              >Disconnect</CButton
            >
          </div>
        </div>
      </div>
    </div>
    <ConfirmationDialog
      :open="shownDialog === 'connect-stripe'"
      title="Connect Stripe account"
      message="You will be redirected to Stripe to connect your account. Do you want to continue?"
      confirm-text="Continue"
      cancel-text="Cancel"
      :loading="isLoadingStripeConnect"
      @confirm="connectStripe"
      @close="closeDialog"
    />

    <ConfirmationDialog
      :open="shownDialog === 'disconnect-stripe'"
      title="Disconnect Stripe account"
      message="Your Stripe account will be disconnected and you no longer will be able to receive payments using stripe. Do you want to continue?"
      confirm-text="Continue"
      cancel-text="Cancel"
      :loading="isLoadingStripeConnect"
      @confirm="disconnectStripe"
      @close="closeDialog"
    />
  </SettingsSection>
</template>

<script async setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  IconCircleCheck,
  IconBrandGoogle,
  IconBrandStripe,
  IconMail,
  IconCreditCard,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import logger from '@/lib/logger.ts'
import { stripeService } from '@/features/settings/stripe.service.ts'
import { tenantStore } from '@/stores/tenant.ts'
import CBadge from '@/components/CBadge.vue'
import type { StripeConfiguration } from '@/features/settings/stripe.model.ts'

// Email configuration
const emailConfig = ref({
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
})

// Save email configuration
const saveEmailConfig = (): void => {
  // TODO: Implement actual save
  logger.debug('Saving email config:', { config: emailConfig.value })
  toast.success('Email configuration saved!')
}

const stripeConfiguration = ref<StripeConfiguration | null>(null)
onMounted(async () => {
  // subscribe to service updates
  stripeConfiguration.value = await stripeService.getConfiguration(
    tenantStore.value?.id as string,
  )
})

const isLoadingStripeConnect = ref(false)

// Configure payment gateway
const connectStripe = async (): Promise<void> => {
  isLoadingStripeConnect.value = true
  const res = await stripeService.connect(
    tenantStore.value?.id as string,
    window.location.origin,
  )
  if (res) window.location.assign(res)
}

const disconnectStripe = (): void => {
  closeDialog()
}

const shownDialog = ref<'connect-stripe' | 'disconnect-stripe' | null>(null)

const openDialog = (dialog: 'connect-stripe' | 'disconnect-stripe'): void => {
  shownDialog.value = dialog
}

const closeDialog = (): void => {
  shownDialog.value = null
}
</script>
