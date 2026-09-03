<template>
  <div class="mx-auto max-w-full md:max-w-7xl mb-4">
    <!-- Reservations Grid -->
    <div class="space-y-4">
      <div
        v-for="reservation in activeReservations"
        :key="reservation.id"
        class="pointer-events-auto dark:bg-gray-800/90 backdrop-blur-2xl bg-gray-50/90 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden shadow-2xl rounded-full cursor-pointer transition-shadow duration-200 min-w-sm"
        @click="openReservationDetail(reservation)"
      >
        <div class="px-2 py-2 sm:p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div
                  class="h-16 w-16 text-xl text-white dark:text-white font-semibold rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                >
                  {{ reservation.display_id }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-gray-600 dark:text-white/50 text-sm">
                  Reservation
                </p>
                <h3
                  class="text-xl font-semibold text-gray-900 dark:text-white truncate"
                >
                  {{ reservation.library_game.game?.name }}
                </h3>
              </div>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <CircularCountdown
                :time="getTimeRemaining(reservation.expires_at)"
                :total-time-minutes="15"
                :size="60"
                :stroke-width="6"
                :show-label="false"
                format="mm:ss"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation Detail Dialog -->
    <ReservationDetail
      :open="isDetailModalOpen"
      :reservation="selectedReservation"
      @close="closeReservationDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import libraryReservationService, {
  type LibraryReservation,
} from '@/features/library/reservations/service.ts'
import CircularCountdown from '@/components/CircularCountdown.vue'
import ReservationDetail from '@/views/public/library/ReservationDetail.vue'
import { authService } from '@/features/auth/service.ts'

const reservations = ref<LibraryReservation[]>([])
const loading = ref(true)
const selectedReservation = ref<LibraryReservation | null>(null)
const isDetailModalOpen = ref(false)

let unsubscribe: (() => void) | null = null
let intervalId: number | null = null

// Current time for reactivity
const now = ref(Date.now())

let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000) // update once per second
})
onUnmounted(() => {
  if (timer !== undefined) {
    clearInterval(timer)
  }
})

// Filter out expired reservations
const activeReservations = computed(() => {
  return reservations.value.filter(
    (reservation) =>
      reservation.status === 'active' &&
      new Date(reservation.expires_at).getTime() > now.value,
  )
})

const closeReservationDetail = () => {
  isDetailModalOpen.value = false
  selectedReservation.value = null
}

onMounted(async () => {
  const user = await authService.getUser()
  if (user) {
    unsubscribe = libraryReservationService.subscribeToUpdates(
      user.id,
      (updatedReservations) => {
        reservations.value = updatedReservations
        loading.value = false
      },
    )
  }
})

onUnmounted(() => {
  // Clean up subscription
  if (unsubscribe) {
    unsubscribe()
  }

  // Clean up interval
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

const openReservationDetail = (reservation: LibraryReservation): void => {
  selectedReservation.value = reservation
  isDetailModalOpen.value = true
}

const getTimeRemaining = (expiresAt: string): number => {
  const now: number = new Date().getTime()
  const expiryTime: number = new Date(expiresAt).getTime()

  return expiryTime - now
}
</script>

<style scoped></style>
