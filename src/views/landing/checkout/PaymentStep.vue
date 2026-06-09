<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  isWaitingForPaymentSession?: boolean
  isWaitingForPaymentConfirmation?: boolean
  paymentIssue?: {
    type: 'warning' | 'error'
    description: string
  } | null
}

interface Emits {
  (e: 'back'): void
  (e: 'submit'): void
}

withDefaults(defineProps<Props>(), {
  isWaitingForPaymentSession: false,
  isWaitingForPaymentConfirmation: false,
  paymentIssue: null,
})
const emit = defineEmits<Emits>()

const { t } = useI18n()
</script>

<template>
  <!-- Payment confirmation polling screen -->
  <div
    v-if="isWaitingForPaymentConfirmation"
    class="flex flex-col items-center justify-center gap-6 py-16 text-center"
  >
    <svg
      class="size-12 animate-spin text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <div>
      <p class="text-lg font-semibold">
        {{ t('checkout.confirming.title') }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('checkout.confirming.description') }}
      </p>
    </div>
  </div>

  <!-- Normal payment form -->
  <div v-else class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        {{ t('checkout.section.payment') }}
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ t('checkout.payment.description') }}
      </p>
    </div>

    <div
      v-if="paymentIssue?.type === 'error'"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
    >
      {{ paymentIssue?.description }}
    </div>

    <div
    <div
      v-else-if="paymentIssue?.type === 'warning'"
      class="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-300"
    >
      {{ paymentIssue?.description }}
    </div>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="rounded-xl border cursor-pointer border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
        @click="emit('back')"
      >
        {{ t('checkout.actions.back') }}
      </button>
      <button
        type="button"
        class="rounded-xl cursor-pointer bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="isWaitingForPaymentSession"
        @click="emit('submit')"
      >
        {{
          isWaitingForPaymentSession
            ? t('checkout.actions.processing')
            : t('checkout.actions.payNow')
        }}
      </button>
    </div>
  </div>
</template>
