<template>
  <div class="mx-auto max-w-full md:max-w-7xl mb-4">
    <!-- Reservation Detail Dialog -->
    <DialogComponent
      :open="props.open"
      title=""
      @close="closeReservationDetail"
    >
      <div v-if="props.reservation" class="space-y-6">
        <!-- Large Reservation Number -->
        <div class="text-center">
          <div class="text-6xl font-bold text-gray-900 dark:text-white">
            #{{ props.reservation.display_id }}
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Reservation Number
          </p>
        </div>

        <!-- Location - Prominent Display -->
        <div
          class="text-center py-6 px-8 rounded-xl bg-gradient-to-br from-primary to-primary-600 shadow-lg"
        >
          <p
            class="text-sm font-medium text-primary-100 uppercase tracking-wider mb-2"
          >
            Game Location
          </p>
          <div class="text-5xl font-bold text-white drop-shadow-lg">
            {{
              props.reservation?.library_game.location?.name || 'No Location'
            }}
          </div>
        </div>

        <!-- Game Info with Image -->
        <div
          class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 flex items-center gap-6"
        >
          <img
            v-if="props.reservation.library_game.game?.image"
            :src="props.reservation.library_game.game.image"
            :alt="props.reservation.library_game.game?.name || 'Game'"
            class="w-32 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
          />
          <div
            v-else
            class="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-lg shadow-md flex items-center justify-center flex-shrink-0"
          >
            <span class="text-gray-500 dark:text-gray-400 text-sm">
              No Image
            </span>
          </div>
          <div class="flex flex-col justify-center">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ props.reservation.library_game.game?.name || 'Unknown Game' }}
            </h3>
            <p
              v-if="props.reservation.library_game.game?.year"
              class="text-lg text-gray-600 dark:text-gray-300 mt-1"
            >
              {{ props.reservation.library_game.game.year }}
            </p>
          </div>
        </div>

        <!-- Countdown Timer -->
        <div class="flex flex-col items-center space-y-3">
          <CircularCountdown
            :time="getTimeRemaining(props.reservation.expires_at)"
            :total-time-minutes="15"
            :size="120"
            :stroke-width="8"
            :show-label="true"
            label="remaining"
            format="mm:ss"
          />
        </div>

        <!-- Actions -->
        <div
          class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4"
        >
          <CButton
            variant="danger"
            size="lg"
            class="order-1 w-full sm:w-auto"
            :loading="cancellingReservation"
            @click="handleCancelReservation"
          >
            Cancel Reservation
          </CButton>
          <CButton
            variant="secondary"
            size="lg"
            class="order-2 w-full sm:w-auto"
            @click="closeReservationDetail"
          >
            Close
          </CButton>
        </div>
      </div>
    </DialogComponent>

    <!-- Cancel Confirmation Dialog -->
    <ConfirmationDialog
      :open="showCancelConfirmation"
      title="Cancel Reservation"
      message="Are you sure you want to cancel this reservation? This action cannot be undone."
      confirm-text="Yes, Cancel"
      cancel-text="No, Keep It"
      variant="danger"
      @confirm="confirmCancel"
      @cancel="showCancelConfirmation = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  default as libraryReservationService,
  type LibraryReservation,
} from '@/features/library/reservations/service.ts'
import CButton from '@/components/CButton.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import CircularCountdown from '@/components/CircularCountdown.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { toast } from 'vue-sonner'
import libraryService from '@/features/library/games/service.ts'
import { LibraryGameStatus } from '@/features/library/games/game.model.ts'

interface Props {
  reservation: LibraryReservation | null
  open?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'cancelled'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
})

const emit = defineEmits<Emits>()

const cancellingReservation = ref(false)
const showCancelConfirmation = ref(false)

const closeReservationDetail = (): void => {
  cancellingReservation.value = false
  showCancelConfirmation.value = false
  emit('close')
}

const handleCancelReservation = (): void => {
  showCancelConfirmation.value = true
}

const confirmCancel = async (): Promise<void> => {
  if (!props.reservation) return

  try {
    cancellingReservation.value = true
    showCancelConfirmation.value = false

    await libraryReservationService.delete(props.reservation.id)
    await libraryService.updateGame(
      props.reservation.library_game.id as number,
      {
        status: LibraryGameStatus.available,
        reservedUntil: undefined,
      },
    )

    toast.success('Reservation cancelled successfully')
    emit('cancelled')
    closeReservationDetail()
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to cancel reservation',
    )
  } finally {
    cancellingReservation.value = false
  }
}

const getTimeRemaining = (expiresAt: string): number => {
  const now: number = new Date().getTime()
  const expiryTime: number = new Date(expiresAt).getTime()

  return expiryTime - now
}
</script>

<style scoped></style>
