<template>
  <div>
    <div class="text-center">
      <h1
        class="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {{ t('auth.checkInbox') }}
      </h1>
      <p class="mt-2 text-sm text-balance text-gray-600 dark:text-gray-400">
        {{ t('auth.verificationCodeSent') }}
        <span class="font-medium text-gray-900 dark:text-white">{{
          email
        }}</span>
      </p>
    </div>

    <form class="mt-8" novalidate @submit.prevent="handleSubmit">
      <fieldset>
        <legend
          class="w-full text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-100"
        >
          {{ t('auth.enterVerificationCode') }}
        </legend>

        <!-- A grid rather than fixed-width boxes: six 48px cells plus gaps
             overflow the 320px screens this has to fit. -->
        <div class="mt-3 grid grid-cols-6 gap-2">
          <input
            v-for="(_digit, index) in otpDigits"
            :key="index"
            :ref="(el) => setInputRef(el as HTMLInputElement, index)"
            v-model="otpDigits[index]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="one-time-code"
            :aria-label="t('auth.digitLabel', { position: index + 1 })"
            :class="otpInputClasses"
            @input="handleInput(index, $event)"
            @keydown="handleKeydown(index, $event)"
            @paste="handlePaste"
          />
        </div>
      </fieldset>

      <CButton
        type="submit"
        size="lg"
        full-width
        class="mt-6"
        :disabled="!isOtpComplete"
        :loading="isLoading"
        :loading-text="t('auth.verifying')"
      >
        {{ t('auth.verifyCode') }}
        <template #icon-right>
          <IconArrowNarrowRight class="size-5" aria-hidden="true" />
        </template>
      </CButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
      {{ t('auth.didntReceiveCode') }}
      <button
        type="button"
        class="cursor-pointer font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        @click="goBack"
      >
        {{ t('auth.tryAgain') }}
      </button>
    </p>

    <p class="mt-2 text-center text-xs text-gray-500 dark:text-gray-500">
      {{ t('auth.codeExpiresNote') }}
    </p>

    <div class="mt-8 text-center">
      <CButton variant="transparent" size="sm" @click="goBack">
        <template #icon-left>
          <IconArrowNarrowLeft class="size-4" aria-hidden="true" />
        </template>
        {{ t('auth.sendToDifferentEmail') }}
      </CButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import {
  FIELD_BASE,
  FIELD_RADIUS,
  FIELD_STATE,
} from '@/components/field.styles'
import { authService } from '@/features/auth/service'
import { RouteNames } from '@/router/routeNames'

const { t } = useI18n()

const OTP_LENGTH = 6
const otpDigits = ref<string[]>(Array.from({ length: OTP_LENGTH }, () => ''))
const inputRefs = ref<HTMLInputElement[]>([])
const isLoading = ref(false)
const route = useRoute()
const router = useRouter()

// The boxes are the same field as everywhere else in the app, only square and
// centred, so they take the shared shell instead of a private copy of it.
const otpInputClasses = [
  FIELD_BASE,
  FIELD_STATE.default,
  FIELD_RADIUS,
  'px-0 py-3 text-center text-xl font-semibold',
]

const email = computed<string>(() =>
  typeof route.query.email === 'string' ? route.query.email : '',
)

if (!email.value) {
  void router.replace({
    name: RouteNames.auth.signIn,
    query: { redirect: route.query.redirect },
  })
}

onMounted(() => {
  inputRefs.value[0]?.focus()
})

// Back goes where the code was asked for. Returning a sign-up to the sign-in
// screen would silently drop the name they had already given us.
const goBack = (): void => {
  void router.push({
    name:
      route.query.flow === 'sign-up'
        ? RouteNames.auth.signUp
        : RouteNames.auth.signIn,
    query: { email: email.value, redirect: route.query.redirect },
  })
}

const isOtpComplete = computed<boolean>(() => {
  return otpDigits.value.every((digit) => digit !== '')
})

const setInputRef = (el: HTMLInputElement, index: number): void => {
  if (el) {
    inputRefs.value[index] = el
  }
}

const handleInput = (index: number, event: Event): void => {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Only allow numeric values
  if (value && !/^\d$/.test(value)) {
    otpDigits.value[index] = ''
    return
  }

  // Move to next input if current has a value
  if (value && index < OTP_LENGTH - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleKeydown = (index: number, event: KeyboardEvent): void => {
  // Handle backspace
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }

  // Handle arrow keys
  if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent): void => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text')

  if (pastedData) {
    const digits = pastedData.replace(/\D/g, '').slice(0, OTP_LENGTH).split('')
    digits.forEach((digit, index) => {
      if (index < OTP_LENGTH) {
        otpDigits.value[index] = digit
      }
    })

    // Focus on the next empty input or the last input
    const nextEmptyIndex = otpDigits.value.findIndex((d) => d === '')
    const focusIndex = nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex
    inputRefs.value[focusIndex]?.focus()
  }
}

const handleSubmit = async (): Promise<void> => {
  if (isOtpComplete.value) {
    isLoading.value = true
    const otp = otpDigits.value.join('')
    try {
      await authService.validateOTP(email.value, otp)
      void router.push({
        name: RouteNames.auth.confirm,
        query: { redirect: route.query.redirect },
      })
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error(t('auth.invalidCode'))
      otpDigits.value = Array.from({ length: OTP_LENGTH }, () => '')
      // Cleared boxes with the caret left at the end would look like a dead
      // form; put them back at the start of the code they have to retype.
      await nextTick()
      inputRefs.value[0]?.focus()
    } finally {
      isLoading.value = false
    }
  }
}
</script>
