<script setup lang="ts">
import {
  InformationCircleIcon,
  XMarkIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconCheck,
} from '@tabler/icons-vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { authService } from '@/features/auth/service.ts'
import router from '@/router'
import { RouteNames } from '@/router/routeNames.ts'
import CInput from '@/components/CInput.vue'
import logger from '@/lib/logger.ts'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const isValidating = ref(true)
const isSuccess = ref(false)
const needsDisplayName = ref(false)
const isUpdatingDisplayName = ref(false)
const errorMessage = ref('')
const countdown = ref(5)
const displayName = ref('')
const displayNameErrors = ref<string[]>([])
const route = useRoute()

onMounted(async () => {
  try {
    // Check if user is authenticated
    const user = await authService.getUser()

    if (!user) {
      throw new Error('No authenticated user found')
    }

    if (!user.access) {
      // User doesn't have roles for this tenant, set up the relationship
      await authService.setTenant(user.id)
    } else {
      logger.debug('User already has role for this tenant:', {
        access: user.access,
      })
    }

    // Check if user has name defined
    if (!user.name) {
      // User needs to set display name
      isValidating.value = false
      needsDisplayName.value = true
    } else {
      // Show success state
      isValidating.value = false
      isSuccess.value = true

      // Start countdown timer
      startCountdown()
    }
  } catch (error) {
    console.error('Authentication confirmation failed:', error)
    isValidating.value = false
    isSuccess.value = false
    errorMessage.value =
      error instanceof Error ? error.message : 'An unexpected error occurred'
  }
})

const updateDisplayName = async (): Promise<void> => {
  displayNameErrors.value = []

  if (!displayName.value.trim()) {
    displayNameErrors.value.push(t('auth.displayNameRequired'))
    return
  }

  if (displayName.value.trim().length < 2) {
    displayNameErrors.value.push(t('auth.displayNameMinLength'))
    return
  }

  isUpdatingDisplayName.value = true

  try {
    const user = await authService.getUser()

    await Promise.all([
      authService.updateUserMetadata({
        display_name: displayName.value.trim(),
      }),
      authService.updateProfile(user?.id as string, {
        name: displayName.value.trim(),
        email: user?.email,
      }),
    ])

    // Update completed, show success state
    needsDisplayName.value = false
    isSuccess.value = true
    startCountdown()
  } catch (error) {
    console.error('Failed to update display name:', error)
    displayNameErrors.value.push(
      error instanceof Error ? error.message : 'Failed to update display name',
    )
  } finally {
    isUpdatingDisplayName.value = false
  }
}

const startCountdown = (): void => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      void redirectToHome()
    }
  }, 1000)
}

const redirectToHome = async (): Promise<void> => {
  const redirect = route.query.redirect

  await router.replace(typeof redirect === 'string' ? redirect : '/')
  //await router.push({ name: RouteNames.public.library })
}

const backToSignIn = async (): Promise<void> => {
  await router.push({ name: RouteNames.auth.signIn })
}
</script>

<template>
  <div v-if="isValidating" class="mt-6 text-center">
    <!-- Loading state -->
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
    >
      <svg
        class="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
    <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
      {{ t('auth.confirmingSignIn') }}
    </h2>
    <p class="mt-2 text-md text-gray-600 dark:text-gray-400">
      {{ t('auth.pleaseWaitVerify') }}
    </p>
  </div>

  <div v-else-if="isSuccess" class="mt-6 text-center">
    <!-- Success state -->
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
    >
      <IconCheck
        class="h-8 w-8 text-green-600 dark:text-green-400"
        aria-hidden="true"
      />
    </div>

    <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
      {{ t('auth.welcomeBack') }}
    </h2>
    <p class="mt-2 text-md text-gray-600 dark:text-gray-400">
      {{ t('auth.successfullySignedIn') }}
    </p>

    <!-- Countdown and redirect info -->
    <div class="mt-8 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <InformationCircleIcon
            class="h-5 w-5 text-green-400 dark:text-green-500"
            aria-hidden="true"
          />
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-800 dark:text-green-300">
            {{ t('auth.redirectingIn', { seconds: countdown }) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Manual redirect button -->
    <div class="mt-6">
      <button
        class="flex w-full justify-center items-center gap-2 rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500"
        @click="redirectToHome"
      >
        <IconArrowNarrowRight class="h-4 w-4" aria-hidden="true" />
        {{ t('auth.continueToHome') }}
      </button>
    </div>
  </div>

  <div v-else-if="needsDisplayName" class="mt-6 text-center">
    <!-- Display Name required state -->
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30"
    >
      <UserIcon
        class="h-8 w-8 text-yellow-600 dark:text-yellow-400"
        aria-hidden="true"
      />
    </div>

    <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
      {{ t('auth.almostThere') }}
    </h2>
    <p class="mt-2 text-md text-gray-600 dark:text-gray-400">
      {{ t('auth.provideDisplayName') }}
    </p>

    <!-- Display Name form -->
    <div class="mt-4">
      <CInput
        id="display-name"
        v-model="displayName"
        :label="t('auth.displayName')"
        type="text"
        :placeholder="t('auth.enterDisplayName')"
        :errors="displayNameErrors"
      />
    </div>

    <div class="mt-6">
      <button
        class="flex w-full justify-center items-center gap-2 rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isUpdatingDisplayName"
        @click="updateDisplayName"
      >
        <IconCheck class="h-4 w-4" aria-hidden="true" />
        <span v-if="isUpdatingDisplayName">{{ t('auth.updating') }}</span>
        <span v-else>{{ t('auth.updateDisplayName') }}</span>
      </button>
    </div>
  </div>

  <div v-else class="mt-6 text-center">
    <!-- Error state -->
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
    >
      <XMarkIcon
        class="h-8 w-8 text-red-600 dark:text-red-400"
        aria-hidden="true"
      />
    </div>

    <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
      {{ t('auth.authenticationFailed') }}
    </h2>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ t('auth.verifySignInFailed') }}
    </p>

    <!-- Error details -->
    <div class="mt-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <XMarkIcon
            class="h-5 w-5 text-red-400 dark:text-red-500"
            aria-hidden="true"
          />
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-300">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Back to sign in button -->
    <div class="mt-6">
      <button
        class="flex w-full justify-center items-center gap-2 rounded-md bg-white dark:bg-white/5 px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus-visible:outline-offset-0"
        @click="backToSignIn"
      >
        <IconArrowNarrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('auth.backToSignIn') }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>
