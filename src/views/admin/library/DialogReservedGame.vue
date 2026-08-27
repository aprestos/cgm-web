<template>
  <DialogComponent
    :open="props.open"
    :title="t('admin.library.reservationDetails')"
    @close="handleClose"
  >
    <div v-if="props.reservation" class="space-y-6">
      <!-- Reservation Number -->
      <div class="text-center">
        <div class="text-4xl font-bold text-gray-900 dark:text-white">
          #&nbsp;{{ props.reservation.display_id }}
        </div>
      </div>

      <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-4">
        {{ t('admin.library.reservedGame') }}
      </h2>
      <!-- Game Details -->
      <div class="p-6 rounded-lg bg-gray-100 dark:bg-gray-900">
        <div class="flex items-center gap-4">
          <img
            v-if="props.reservation?.library_game?.game?.image"
            :src="gameImage"
            :alt="gameName"
            class="w-20 h-20 rounded-lg object-cover shadow-sm flex-shrink-0"
            @error="handleImageError"
          />
          <div
            v-else
            class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0"
          >
            <span class="text-gray-500 dark:text-gray-400 text-xs">
              {{ t('admin.library.noImage') }}
            </span>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ gameName }}
            </h3>
            <div
              class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="flex items-center">
                <IconCalendar class="mr-1 size-4" />
                {{
                  props.reservation?.library_game?.game?.year ||
                  t('admin.library.unknown')
                }}
              </span>
              <span
                v-if="props.reservation.library_game?.location?.name"
                class="flex items-center"
              >
                <IconMapPinFilled class="size-4 mr-1" />
                {{ props.reservation?.library_game?.location?.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-4">
        {{ t('admin.library.person') }}
      </h2>
      <!-- User Details - Loading State -->
      <div
        v-if="isLoadingUser"
        class="p-6 rounded-lg dark:bg-gray-900 bg-gray-100 animate-pulse"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0"
          ></div>
          <div class="flex-1 space-y-3">
            <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>
          </div>
        </div>
      </div>

      <!-- User Details - Loaded -->
      <div v-else class="p-6 rounded-lg dark:bg-gray-900 bg-gray-100">
        <div class="flex items-center gap-4">
          <div
            class="flex text-4xl w-20 h-20 items-center justify-center rounded-full bg-primary-600 text-white font-semibold"
          >
            F
          </div>
          <div class="flex-1 p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ user?.name || t('admin.library.user') }}
            </h3>
            <p
              class="text-sm flex flex-row text-gray-600 dark:text-gray-300 mt-1"
            >
              <IconMail class="size-4 mr-2" /> {{ user?.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4 border-t border-gray-200 dark:border-gray-600"
      >
        <button
          type="button"
          class="order-2 sm:order-1 w-full sm:w-auto rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          @click="handleClose"
        >
          {{ t('common.actions.close') }}
        </button>
        <button
          type="button"
          class="order-1 sm:order-2 w-full sm:w-auto rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isWithdrawing"
          @click="handleReservationWithdraw"
        >
          <span v-if="isWithdrawing">{{ t('admin.library.withdrawing') }}</span>
          <span v-else>{{ t('admin.library.withdrawGame') }}</span>
        </button>
      </div>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import DialogComponent from '@/components/DialogComponent.vue'
import type { LibraryReservation } from '@/features/library/reservations/service'
import { type User, userService } from '@/features/users/service.ts'
import { IconMail, IconCalendar, IconMapPinFilled } from '@tabler/icons-vue'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'

const { t } = useI18n()

interface LibraryGameWithDetails {
  game?: {
    name?: string
    year?: number
    image?: string
    image_url?: string
  }
  location?: {
    id?: number
    name?: string
  }
}

interface Props {
  open?: boolean
  reservation?: LibraryReservation | null
}

interface Emits {
  (e: 'close'): void
  (e: 'withdraw', reservationId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  reservation: null,
})

const emit = defineEmits<Emits>()

const isLoadingUser = ref(false)
const isWithdrawing = ref(false)

const user = ref<User | null>(null)

// Watch reservation prop to load user data when it changes
watch(
  () => props.reservation,
  async (reservation) => {
    if (!reservation?.user_id) {
      user.value = null
      return
    }

    isLoadingUser.value = true
    try {
      user.value = await userService.getById(reservation.user_id)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      toast.error('Failed to fetch user data. Please try again.')
    } finally {
      isLoadingUser.value = false
    }
  },
)

// Computed properties
const gameName = computed(() => {
  if (
    props.reservation?.library_game &&
    typeof props.reservation.library_game === 'object' &&
    'game' in props.reservation.library_game
  ) {
    const libraryGame = props.reservation.library_game as LibraryGameWithDetails
    return libraryGame.game?.name || t('admin.library.unknownGame')
  }
  return t('admin.library.unknownGame')
})

const gameImage = computed(() => {
  if (
    props.reservation?.library_game &&
    typeof props.reservation.library_game === 'object' &&
    'game' in props.reservation.library_game
  ) {
    const libraryGame = props.reservation.library_game as LibraryGameWithDetails
    return libraryGame.game?.image_url || libraryGame.game?.image
  }
  return undefined
})

// Event handlers
const handleClose = (): void => {
  emit('close')
}

const handleImageError = (event: Event): void => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleReservationWithdraw = async (): Promise<void> => {
  // Find the game associated with this reservation
  if (!props.reservation) return
  isWithdrawing.value = true

  try {
    await libraryWithdrawService.create(
      props.reservation?.library_game.id as number,
      props.reservation?.user_id,
    )

    toast.success(t('admin.library.withdrawSuccess', { name: gameName.value }))

    emit('close')
  } catch (error) {
    console.error('Failed to withdraw game: ', error)
    toast.error(t('admin.library.withdrawFailed'))
  } finally {
    isWithdrawing.value = false
  }
}
</script>
