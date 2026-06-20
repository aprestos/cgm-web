<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { QrcodeStream } from 'vue-qrcode-reader'
import type { JWTPayload } from 'jose'
import {
  IconCircleCheck,
  IconCircleX,
  IconTicket,
  IconUser,
} from '@tabler/icons-vue'
import { verifyTicketQR } from '@/utils/ticket'
import DialogComponent from '@/components/DialogComponent.vue'
import ticketIssuanceService from '@/features/tickets/issuance.service.ts'
import logger from '@/lib/logger.ts'
import { computedAsync } from '@vueuse/core'
import { formatWeekday } from '@/utils/date.ts'
import { DateTime } from 'luxon'

const { t, locale } = useI18n()

type TicketQrPayload = JWTPayload & { order?: { id?: string } }

const dialogOpen = ref(false)
const isValid = ref(true) // dummy
const detectedPayload = ref<TicketQrPayload | null>(null)

const onDetect = async (detectedCodes: DetectedBarcode[]): Promise<void> => {
  const raw = detectedCodes[0]?.rawValue
  if (!raw) return

  try {
    detectedPayload.value = await verifyTicketQR(raw)
    isValid.value = true
  } catch {
    detectedPayload.value = null
    isValid.value = false
    toast.error(t('admin.checkIn.errorInvalidTicket'))
  }

  dialogOpen.value = true
}

const checkin = async () => {
  const orderId = detectedPayload.value?.order?.id

  if (orderId) {
    try {
      await ticketIssuanceService.checkin(orderId)
      closeDialog()
    } catch (error) {
      logger.warn('Error checking in ticket:', { error })
      toast.error(t('admin.checkIn.errorCheckInFailed'))
    }
  }
}

const canCheckin = computedAsync(async () => {
  const orderId = detectedPayload?.value?.order?.id

  if (orderId) {
    try {
      const status = await ticketIssuanceService.getStatus(orderId)
      return status === 'valid'
    } catch (error) {
      logger.warn('Error checking issuance status', { error })
      toast.error(t('admin.checkIn.errorStatusFailed'))
      return false
    }
  }
})

const closeDialog = (): void => {
  dialogOpen.value = false
}
</script>

<template>
  <div>
    <qrcode-stream @detect="onDetect"></qrcode-stream>

    <dialog-component :open="dialogOpen" size="sm" @close="closeDialog">
      <div class="flex flex-col items-center gap-6 pb-2">
        <!-- Status banner -->
        <div
          v-if="!canCheckin"
          class="flex flex-col items-center gap-3 w-full rounded-xl py-6 bg-red-50 dark:bg-red-900/20"
        >
          <IconCircleX class="size-16 text-red-500" :stroke-width="1.5" />
          <span class="text-lg font-semibold text-red-700 dark:text-red-400">
            {{ t('admin.checkIn.alreadyCheckedIn') }}
          </span>
        </div>

        <div
          v-else-if="!isValid"
          class="flex flex-col items-center gap-3 w-full rounded-xl py-6 bg-yellow-50 dark:bg-yellow-900/20"
        >
          <IconCircleX class="size-16 text-yellow-500" :stroke-width="1.5" />
          <span
            class="text-lg font-semibold text-yellow-700 dark:text-yellow-400"
          >
            {{ t('admin.checkIn.invalidTicket') }}
          </span>
        </div>
        <div
          v-else
          class="flex flex-col items-center gap-3 w-full rounded-xl py-6 bg-emerald-50 dark:bg-emerald-900/20"
        >
          <IconCircleCheck
            class="size-16 text-emerald-500"
            :stroke-width="1.5"
          />
          <span
            class="text-lg font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {{ t('admin.checkIn.validTicket') }}
          </span>
        </div>

        <!-- Attendee info -->
        <div class="flex flex-col gap-4 w-full">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 size-10 shrink-0"
            >
              <icon-user class="size-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="flex flex-col">
              <span
                class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium"
                >{{ t('admin.checkIn.attendee') }}</span
              >
              <!-- TODO: map from detectedPayload.name -->
              <span
                class="text-base font-semibold text-gray-900 dark:text-white"
                >{{ detectedPayload?.name ?? '' }}</span
              >
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 size-10 shrink-0"
            >
              <icon-ticket class="size-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="flex flex-col">
              <span
                class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium"
                >{{ t('admin.checkIn.ticketType') }}</span
              >
              <!-- TODO: map from detectedPayload -->
              <span
                class="text-base font-semibold text-gray-900 dark:text-white"
                >{{
                  formatWeekday(
                    DateTime.fromSeconds(
                      detectedPayload?.nbf ?? 0,
                    ).toISO() as string,
                    DateTime.fromSeconds(
                      detectedPayload?.exp ?? 0,
                    ).toISO() as string,
                    locale,
                  )
                }}</span
              >
            </div>
          </div>
        </div>

        <!-- Actions -->
        <button
          type="button"
          class="w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
          :class="
            isValid
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-gray-400 cursor-not-allowed'
          "
          :disabled="isValid && canCheckin === null"
          @click="isValid && canCheckin ? checkin() : closeDialog()"
        >
          {{
            isValid && canCheckin
              ? t('admin.checkIn.confirmCheckIn')
              : t('admin.checkIn.dismiss')
          }}
        </button>
      </div>
    </dialog-component>
  </div>
</template>

<style scoped></style>
