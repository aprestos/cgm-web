<template>
  <div>
    <!-- Lock icon -->
    <div
      class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
    >
      <LockClosedIcon
        class="h-6 w-6 text-indigo-600 dark:text-indigo-400"
        aria-hidden="true"
      />
    </div>

    <!-- Header -->
    <div class="mt-6 text-center">
      <h2
        class="text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white"
      >
        {{ t('auth.signInToAccount') }}
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ t('auth.signInDescription') }}
      </p>
    </div>

    <!-- Form -->
    <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
      <div>
        <label
          for="email"
          class="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
        >
          {{ t('auth.emailAddress') }}
        </label>
        <div class="relative mt-2">
          <input
            id="email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :placeholder="t('auth.enterEmailPlaceholder')"
            class="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-white/5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
          />
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <AtSymbolIcon
              class="h-5 w-5 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          :disabled="isLoading || !email"
          class="flex cursor-pointer w-full justify-center items-center gap-2 rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isLoading">
            <PaperAirplaneIcon class="h-4 w-4" aria-hidden="true" />
          </span>
          <svg
            v-else
            class="h-4 w-4 animate-spin"
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
          {{ isLoading ? t('auth.sendingMagicLink') : t('auth.sendMagicLink') }}
        </button>
      </div>
    </form>

    <!-- Social Login Section -->
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span
            class="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400"
          >
            {{ t('auth.orContinueWith') }}
          </span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <button
          disabled
          class="flex w-full items-center justify-center gap-3 rounded-md bg-white dark:bg-white/5 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconBrandGoogleFilled />
          <span>{{ t('auth.google') }}</span>
        </button>

        <button
          disabled
          class="flex w-full items-center justify-center gap-3 rounded-md bg-white dark:bg-white/5 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconBrandAppleFilled />
          <span>{{ t('auth.apple') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AtSymbolIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconBrandGoogleFilled, IconBrandAppleFilled } from '@tabler/icons-vue'

const { t } = useI18n()

interface Emits {
  (e: 'submit', email: string): void
}

const emit = defineEmits<Emits>()

const email = ref<string>('')
const isLoading = ref<boolean>(false)

const handleSubmit = (): void => {
  if (!email.value || isLoading.value) return

  isLoading.value = true
  emit('submit', email.value)
}

defineExpose({
  setLoading: (loading: boolean): void => {
    isLoading.value = loading
  },
  reset: (): void => {
    email.value = ''
    isLoading.value = false
  },
})
</script>
