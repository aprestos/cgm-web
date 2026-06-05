<script setup lang="ts">
import { useRegle } from '@regle/core'
import { email, required } from '@regle/rules'
import { reactive } from 'vue'
import { IconTicket } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { TicketAttendee } from '@/views/landing/checkout/checkout.model'

interface Emits {
  (e: 'back'): void
  (e: 'continue'): void
}

const emit = defineEmits<Emits>()

const attendees = defineModel<TicketAttendee[]>('attendees', { required: true })

// reactive() auto-unwraps the ref so Regle sees a plain reactive object
const formData = reactive({ attendees })

const { r$ } = useRegle(formData, {
  attendees: {
    $each: {
      holderName: { required },
      holderEmail: { required, email },
    },
  },
})

const { t } = useI18n()

async function handleContinue(): Promise<void> {
  const formRules = await r$.$validate()
  if (formRules.valid) {
    emit('continue')
  }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        {{ t('checkout.section.tickets') }}
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ t('checkout.tickets.description') }}
      </p>
    </div>

    <div class="space-y-4">
      <article
        v-for="(attendee, index) in attendees"
        :key="attendee.key"
        class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-950"
      >
        <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          <IconTicket class="mr-1 inline size-4" />
          {{ attendee.ticketName }} ·
          {{ t('checkout.tickets.ticketNumber', { number: index + 1 }) }}
        </p>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ t('checkout.account.name') }}
            </label>
            <input
              v-model="attendees[index].holderName"
              type="text"
              class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
              :class="{
                'border-red-400 dark:border-red-500':
                  r$.attendees.$each[index]?.holderName.$error,
              }"
            />
            <p
              v-if="r$.attendees.$each[index]?.holderName.$error"
              class="mt-1 text-xs text-red-500"
            >
              {{ t('checkout.validation.nameRequired') }}
            </p>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ t('checkout.account.email') }}
            </label>
            <input
              v-model="attendees[index].holderEmail"
              type="email"
              class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-gray-900"
              :class="{
                'border-red-400 dark:border-red-500':
                  r$.attendees.$each[index]?.holderEmail.$error,
              }"
            />
            <p
              v-if="r$.attendees.$each[index]?.holderEmail.$error"
              class="mt-1 text-xs text-red-500"
            >
              {{ t('checkout.validation.emailRequired') }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="rounded-xl cursor-pointer border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
        @click="emit('back')"
      >
        {{ t('checkout.actions.back') }}
      </button>
      <button
        type="button"
        class="rounded-xl cursor-pointer bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        @click="handleContinue"
      >
        {{ t('checkout.actions.continue') }}
      </button>
    </div>
  </div>
</template>
