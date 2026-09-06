<script setup lang="ts">
import {
  IconArrowNarrowRight,
  IconCheck,
  IconLoader2,
  IconX,
} from '@tabler/icons-vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryValue } from 'vue-router'
import { RouteNames } from '@/router/routeNames.ts'
import { stripeService } from '@/features/settings/stripe.service.ts'
import { tenantStore } from '@/features/tenant/tenant.store'

const router = useRouter()
const route = useRoute()

const isLoading = ref<boolean>(true)
const isSuccess = ref<boolean>(false)
const title = ref<string>('Connecting Stripe')
const message = ref<string>('Processing Stripe callback...')
const countdown = ref<number>(5)

function normalizeQueryValue(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === 'string')
  }

  return typeof value === 'string' ? value : undefined
}

// Codes the edge function sets when it redirects back here. Stripe's own
// error codes fall through to the description it sends alongside them.
const ERROR_MESSAGES: Record<string, string> = {
  exchange_failed:
    'We could not finish linking your Stripe account. Please try connecting it again.',
  missing_code:
    'Stripe did not send back an authorization code. Please try connecting again.',
}

function describeError(code: string, description?: string): string {
  return (
    (Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : undefined) ??
    description ??
    'Stripe returned an error while trying to connect your account.'
  )
}

async function redirectToAdvancedSettings(): Promise<void> {
  await router.push({ name: RouteNames.admin.settingsAdvanced })
}

onMounted(async () => {
  const queryError = normalizeQueryValue(route.query.error)
  const queryErrorDescription = normalizeQueryValue(
    route.query.error_description,
  )
  const queryCode = normalizeQueryValue(route.query.code)

  const stripeResult = normalizeQueryValue(route.query.stripe)

  if (queryError) {
    isSuccess.value = false
    title.value = 'Stripe connection failed'
    message.value = describeError(queryError, queryErrorDescription)
  } else if (stripeResult === 'connected') {
    // The edge function exchanged the code and stored the account before
    // sending the browser here, so there is nothing left to do but report it.
    isSuccess.value = true
    title.value = 'Stripe connected successfully'
    message.value =
      'Your Stripe account has been connected. You will be redirected to settings.'
  } else if (queryCode) {
    // Retired flow: Stripe used to redirect straight to the tenant's origin
    // with the code, and this page posted it back. Kept so this page still
    // works against a function that has not been redeployed yet; remove it,
    // and stripeService.callback(), once the new callback is live.

    isLoading.value = true
    try {
      await stripeService.callback(
        tenantStore.value?.id as string,
        route.query.code as string,
        route.query.state as string,
      )
      isSuccess.value = true
      title.value = 'Stripe connected successfully'
      message.value =
        'Your Stripe account has been connected. You will be redirected to settings.'
    } catch {
      isSuccess.value = false
      title.value = 'Unable to connect your account'
      message.value =
        'Something went wrong while linking to stripe. Please try connecting your account again.'
    }
  } else {
    isSuccess.value = false
    title.value = 'Invalid callback'
    message.value =
      'No callback data was provided by Stripe. Please try connecting your account again.'
  }

  isLoading.value = false
  //startCountdown()
})
</script>

<template>
  <div
    class="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4"
  >
    <div
      class="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full"
          :class="
            isLoading
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : isSuccess
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          <IconLoader2 v-if="isLoading" class="h-5 w-5 animate-spin" />
          <IconCheck v-else-if="isSuccess" class="h-5 w-5" />
          <IconX v-else class="h-5 w-5" />
        </div>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h1>
      </div>

      <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
        {{ message }}
      </p>

      <div class="mt-6 flex items-center justify-between gap-4">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Redirecting in {{ countdown }}s
        </span>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          @click="redirectToAdvancedSettings"
        >
          Back to settings
          <IconArrowNarrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
