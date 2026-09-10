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
            class="mt-4 flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30"
              >
                <IconBrandStripe
                  class="h-6 w-6 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                    >Stripe</span
                  >
                  <CBadge
                    v-if="stripeConfiguration"
                    size="sm"
                    :type="
                      stripeConfiguration.accountType === 'live'
                        ? 'blue'
                        : 'gray'
                    "
                    >{{
                      stripeConfiguration.accountType === 'live'
                        ? 'Live'
                        : 'Sandbox'
                    }}</CBadge
                  >
                </div>
                <div class="mt-1 flex items-center">
                  <CBadge
                    v-if="stripeConfiguration?.onboardingStatus === 'pending'"
                    size="sm"
                    type="yellow"
                    >Setup incomplete</CBadge
                  >
                  <CBadge
                    v-else-if="
                      stripeConfiguration?.onboardingStatus === 'complete'
                    "
                    size="sm"
                    type="green"
                    ><IconCircleCheck class="mr-1" size="14" />Active</CBadge
                  >
                  <CBadge
                    v-else-if="
                      stripeConfiguration?.onboardingStatus === 'restricted'
                    "
                    size="sm"
                    type="red"
                    >Restricted</CBadge
                  >
                  <CBadge v-else size="sm" type="gray">Not connected</CBadge>
                </div>
              </div>
            </div>
            <CButton
              v-if="isStripeConnected"
              type="button"
              size="sm"
              variant="secondary"
              @click="() => openDialog('disconnect-stripe')"
              >Disconnect</CButton
            >
            <CButton
              v-else
              type="button"
              size="sm"
              variant="secondary"
              @click="() => openDialog('connect-stripe')"
              >{{
                stripeConfiguration?.onboardingStatus === 'pending'
                  ? 'Continue setup'
                  : 'Connect'
              }}</CButton
            >
          </div>
        </div>
      </div>
    </div>
    <ConfirmationDialog
      :open="shownDialog === 'connect-stripe'"
      title="Connect Stripe account"
      confirm-text="Continue"
      cancel-text="Cancel"
      :loading="isLoadingStripeConnect"
      :confirm-disabled="!selectedAccountType"
      @confirm="connectStripe"
      @close="closeDialog"
    >
      <p>
        Choose the type of Stripe account you want to connect. You will be
        redirected to Stripe to complete the setup.
      </p>
      <fieldset class="mt-4">
        <legend class="sr-only">Stripe account type</legend>
        <div class="space-y-3">
          <label
            v-for="option in STRIPE_ACCOUNT_TYPE_OPTIONS"
            :key="option.value"
            class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
            :class="
              selectedAccountType === option.value
                ? 'border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-primary-500/10'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'
            "
          >
            <input
              v-model="selectedAccountType"
              type="radio"
              name="stripe-account-type"
              :value="option.value"
              class="mt-0.5 size-4 shrink-0 border-gray-300 text-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-900"
            />
            <span>
              <span
                class="block text-sm font-semibold text-gray-900 dark:text-white"
                >{{ option.label }}</span
              >
              <span
                class="mt-1 block text-sm text-gray-500 dark:text-gray-400"
                >{{ option.description }}</span
              >
            </span>
          </label>
        </div>
      </fieldset>
    </ConfirmationDialog>

    <ConfirmationDialog
      :open="shownDialog === 'disconnect-stripe'"
      title="Disconnect Stripe account"
      message="Your Stripe account will be disconnected and you no longer will be able to receive payments using stripe. Do you want to continue?"
      confirm-text="Continue"
      cancel-text="Cancel"
      :loading="isLoadingStripeConnect"
      @confirm="handleConfirmation"
      @close="closeDialog"
    />
  </SettingsSection>
</template>

<script async setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandStripe,
  IconCheck,
  IconCircleCheck,
  IconCreditCard,
  IconMail,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import logger from '@/lib/logger.ts'
import { stripeService } from '@/features/settings/stripe.service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import CBadge from '@/components/CBadge.vue'
import type { StripeConfiguration } from '@/features/settings/stripe.model.ts'

const tenantStore = useTenantStore()

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

const isStripeConnected = computed(
  () =>
    stripeConfiguration.value?.onboardingStatus === 'complete' ||
    stripeConfiguration.value?.onboardingStatus === 'restricted',
)
onMounted(async () => {
  // subscribe to service updates
  stripeConfiguration.value = await stripeService.getConfiguration(
    tenantStore.tenant?.id as string,
  )
})

const isLoadingStripeConnect = ref(false)

const STRIPE_ACCOUNT_TYPE_OPTIONS: ReadonlyArray<{
  value: StripeConfiguration['accountType']
  label: string
  description: string
}> = [
  {
    value: 'sandbox',
    label: 'Sandbox',
    description:
      'Connect a Stripe test account. Payments are simulated and no real money is moved — use this to try out ticket sales and checkout.',
  },
  {
    value: 'live',
    label: 'Live',
    description:
      'Connect your real Stripe account. Payments are charged to your customers and paid out to you.',
  },
]

const selectedAccountType = ref<StripeConfiguration['accountType'] | null>(null)

const handleConfirmation = async (): Promise<void> => {
  if (!stripeConfiguration?.value?.accountId) {
    await connectStripe()
  } else {
    await disconnectStripe()
  }
}

// Configure payment gateway
const connectStripe = async (): Promise<void> => {
  if (!selectedAccountType.value) return
  isLoadingStripeConnect.value = true
  const res = await stripeService.connect(
    tenantStore.tenant?.id as string,
    window.location.origin,
    selectedAccountType.value,
  )
  if (res) {
    window.location.assign(res)
  }
}

const disconnectStripe = async (): Promise<void> => {
  isLoadingStripeConnect.value = true
  try {
    await stripeService.disconnect(tenantStore.tenant?.id as string)
  } catch (error) {
    logger.error('Error disconnecting Stripe:', { error })
    toast.error('Failed to disconnect Stripe')
  } finally {
    isLoadingStripeConnect.value = false
  }

  closeDialog()
}

const shownDialog = ref<'connect-stripe' | 'disconnect-stripe' | null>(null)

const openDialog = (dialog: 'connect-stripe' | 'disconnect-stripe'): void => {
  // Resuming an incomplete setup keeps the account type already on record.
  if (dialog === 'connect-stripe')
    selectedAccountType.value = stripeConfiguration.value?.accountType ?? null
  shownDialog.value = dialog
}

const closeDialog = (): void => {
  shownDialog.value = null
}
</script>
