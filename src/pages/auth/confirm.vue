<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRegle } from '@regle/core'
import { minLength, required, withMessage } from '@regle/rules'
import {
  IconAlertTriangle,
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconCheck,
  IconLoader2,
  IconUser,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import { authService } from '@/features/auth/service'
import logger from '@/lib/logger'
import { RouteNames } from '@/router/routeNames'
import { useTenantStore } from '@/features/tenant/tenant.store'

definePageMeta({
  name: RouteNames.auth.confirm,
})

const { t } = useI18n()
const tenantStore = useTenantStore()

const MIN_NAME_LENGTH = 2
const REDIRECT_SECONDS = 5

const isValidating = ref(true)
const isSuccess = ref(false)
const needsDisplayName = ref(false)
const isUpdatingDisplayName = ref(false)
const errorMessage = ref('')
const countdown = ref(REDIRECT_SECONDS)
const route = useRoute()
const router = useRouter()

// Where a name gets collected from everyone who did not come through sign-up —
// which sign-in deliberately allows, so this is a normal path and not a
// leftover. A sign-up carries the name in user metadata, which the user-tenant
// function copies into the profile row, so those users skip straight past this.
const form = reactive({ displayName: '' })

const { r$ } = useRegle(form, {
  displayName: {
    required: withMessage(required, () => t('auth.displayNameRequired')),
    minLength: withMessage(minLength(MIN_NAME_LENGTH), () =>
      t('auth.displayNameMinLength'),
    ),
  },
})

let timer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

onMounted(async () => {
  try {
    // Check if user is authenticated
    const tenantId = tenantStore.tenant?.id
    const user = tenantId ? await authService.getUser(tenantId) : null

    if (!user || !tenantId) {
      throw new Error('No authenticated user found')
    }

    if (!user.access) {
      // User doesn't have roles for this tenant, set up the relationship
      await authService.setTenant(tenantId, user.id)
    } else {
      logger.debug('User already has role for this tenant:', {
        access: user.access,
      })
    }

    isValidating.value = false

    if (user.name) {
      isSuccess.value = true
      startCountdown()
    } else {
      needsDisplayName.value = true
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
  const { valid } = await r$.$validate()
  if (!valid || isUpdatingDisplayName.value) return

  isUpdatingDisplayName.value = true
  const name = form.displayName.trim()

  try {
    const tenantId = tenantStore.tenant?.id
    const user = tenantId ? await authService.getUser(tenantId) : null

    await Promise.all([
      authService.updateUserMetadata({ display_name: name }),
      authService.updateProfile(user?.id as string, {
        name,
        email: user?.email,
      }),
    ])

    // Update completed, show success state
    needsDisplayName.value = false
    isSuccess.value = true
    startCountdown()
  } catch (error) {
    console.error('Failed to update display name:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to update display name'
    needsDisplayName.value = false
  } finally {
    isUpdatingDisplayName.value = false
  }
}

const startCountdown = (): void => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      void redirectToHome()
    }
  }, 1000)
}

const redirectToHome = async (): Promise<void> => {
  const redirect = route.query.redirect

  await router.replace(typeof redirect === 'string' ? redirect : '/')
}

const backToSignIn = async (): Promise<void> => {
  await router.push({ name: RouteNames.auth.signIn })
}

const state = computed<'validating' | 'success' | 'name' | 'error'>(() => {
  if (isValidating.value) return 'validating'
  if (isSuccess.value) return 'success'
  if (needsDisplayName.value) return 'name'
  return 'error'
})

// One tinted disc per state, so the four outcomes read as the same screen
// changing rather than as four different screens.
const BADGE: Record<
  'validating' | 'success' | 'name' | 'error',
  { icon: typeof IconCheck; classes: string }
> = {
  validating: {
    icon: IconLoader2,
    classes:
      'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  },
  success: {
    icon: IconCheck,
    classes:
      'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
  },
  name: {
    icon: IconUser,
    classes:
      'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  error: {
    icon: IconAlertTriangle,
    classes: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  },
}

const badge = computed(() => BADGE[state.value])

const heading = computed(() => {
  switch (state.value) {
    case 'validating':
      return t('auth.confirmingSignIn')
    case 'success':
      return t('auth.welcomeBack')
    case 'name':
      return t('auth.almostThere')
    default:
      return t('auth.authenticationFailed')
  }
})

const description = computed(() => {
  switch (state.value) {
    case 'validating':
      return t('auth.pleaseWaitVerify')
    case 'success':
      return t('auth.successfullySignedIn')
    case 'name':
      return t('auth.provideDisplayName')
    default:
      return t('auth.verifySignInFailed')
  }
})
</script>

<template>
  <div class="text-center">
    <div
      class="mx-auto flex size-14 items-center justify-center rounded-full"
      :class="badge.classes"
    >
      <component
        :is="badge.icon"
        class="size-7"
        :class="{ 'animate-spin': state === 'validating' }"
        aria-hidden="true"
      />
    </div>

    <h1
      class="mt-6 font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
    >
      {{ heading }}
    </h1>
    <p class="mt-2 text-sm text-balance text-gray-600 dark:text-gray-400">
      {{ description }}
    </p>

    <template v-if="state === 'success'">
      <CButton size="lg" full-width class="mt-8" @click="redirectToHome"
        >{{ t('auth.continueToHome') }}
        <template #icon-right>
          <IconArrowNarrowRight class="size-5" aria-hidden="true" />
        </template>
      </CButton>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-500">
        {{ t('auth.redirectingIn', { seconds: countdown }) }}
      </p>
    </template>

    <form
      v-else-if="state === 'name'"
      class="mt-8 text-left"
      novalidate
      @submit.prevent="updateDisplayName"
    >
      <CInput
        id="display-name"
        v-model="form.displayName"
        type="text"
        name="name"
        autocomplete="name"
        size="lg"
        :label="t('auth.displayName')"
        :placeholder="t('auth.enterDisplayName')"
        :errors="r$.$errors.displayName"
      />
      <CButton
        type="submit"
        size="lg"
        full-width
        class="mt-5"
        :loading="isUpdatingDisplayName"
        :loading-text="t('auth.updating')"
      >
        {{ t('auth.updateDisplayName') }}
        <template #icon-right>
          <IconArrowNarrowRight class="size-5" aria-hidden="true" />
        </template>
      </CButton>
    </form>

    <template v-else-if="state === 'error'">
      <p
        v-if="errorMessage"
        class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300"
      >
        {{ errorMessage }}
      </p>
      <CButton
        variant="secondary"
        size="lg"
        full-width
        class="mt-6"
        @click="backToSignIn"
      >
        <template #icon-left>
          <IconArrowNarrowLeft class="size-5" aria-hidden="true" />
        </template>
        {{ t('auth.backToSignIn') }}
      </CButton>
    </template>
  </div>
</template>
