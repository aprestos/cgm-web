<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AccountForm } from '@/views/landing/checkout/checkout.model'

interface Props {
  errors: Record<string, string>
  isLoading: boolean
}

interface Emits {
  (e: 'continue'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const form = defineModel<AccountForm>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        {{ t('checkout.section.account') }}
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ t('checkout.account.description') }}
      </p>
    </div>

    <p v-if="isLoading" class="text-sm text-gray-500">
      {{ t('checkout.account.loading') }}
    </p>

    <template v-else>
      <div>
        <label
          class="text-sm font-medium text-gray-700 dark:text-gray-200"
          for="checkout-account-email"
        >
          {{ t('checkout.account.email') }}
        </label>
        <input
          id="checkout-account-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-950"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-500">
          {{ errors.email }}
        </p>
      </div>

      <label
        class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-950"
      >
        <input
          v-model="form.acceptedTerms"
          type="checkbox"
          class="mt-0.5 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-600 dark:text-gray-300">{{
          t('checkout.account.terms')
        }}</span>
      </label>
      <p v-if="errors.terms" class="-mt-4 text-xs text-red-500">
        {{ errors.terms }}
      </p>

      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          @click="emit('continue')"
        >
          {{ t('checkout.actions.continue') }}
        </button>
      </div>
    </template>
  </div>
</template>
