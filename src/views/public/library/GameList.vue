<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getStatus,
  type LibraryGame,
} from '@/features/library/games/game.model.ts'
import {
  libraryService,
  type FilterOptions,
} from '@/features/library/games/service.ts'
import GameItem from './GameItem.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import libraryReservationService from '@/features/library/reservations/service.ts'
import { toast } from 'vue-sonner'
import { authService } from '@/features/auth/service.ts'
import DialogGameDetail from '@/views/public/library/DialogGameDetail.vue'
import { RouteNames } from '@/router/routeNames.ts'

const { t } = useI18n()
const router = useRouter()

const allGames = ref<LibraryGame[]>([])
const loading = ref(true)
const selectedGameId = ref<string>('')
const isDetailModalOpen = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(20)
let unsubscribe: (() => void) | null = null
let observer: IntersectionObserver | null = null
const loadMoreTrigger = ref<HTMLElement>()

// Reservation confirmation dialog state
const showReservationDialog = ref(false)
const selectedGameForReservation = ref<LibraryGame | null>(null)
const loadingReservation = ref(false)
const isAuthenticated = ref(false)

// Authentication required dialog state
const showAuthDialog = ref(false)

interface Props {
  filters?: FilterOptions | undefined
}

const props: Props = withDefaults(defineProps<Props>(), {
  filters: undefined,
})

// Watch for filter changes and reset pagination
watch(
  () => props.filters,
  () => {
    resetPagination()
  },
  { deep: true },
)

// Paginated games for display (infinite scroll)
const games = computed(() => {
  const endIndex = currentPage.value * itemsPerPage.value
  return filteredGames.value.slice(0, endIndex)
})

// Check if there are more games to load
const hasMoreGames = computed(() => {
  return games.value.length < filteredGames.value.length
})

const loadMoreGames = (): void => {
  if (hasMoreGames.value) {
    currentPage.value++
  }
}

const resetPagination = (): void => {
  currentPage.value = 1
  setupIntersectionObserver()
}

const setupIntersectionObserver = (): void => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (
        entry &&
        entry.isIntersecting &&
        hasMoreGames.value &&
        !loading.value
      ) {
        loadMoreGames()
      }
    },
    {
      rootMargin: '100px',
      threshold: 0.1,
    },
  )

  // Observe the load more trigger element
  void nextTick(() => {
    if (loadMoreTrigger.value && observer) {
      observer.observe(loadMoreTrigger.value)
    }
  })
}

// Reactive filtered games based on current filters
const filteredGames = computed(() => {
  if (!props.filters) return allGames.value
  return libraryService.applyFilters(allGames.value, props.filters)
})

const openGameDetail = (gameId: number): void => {
  selectedGameId.value = gameId.toString()
  isDetailModalOpen.value = true
}

const closeGameDetail = (): void => {
  isDetailModalOpen.value = false
  selectedGameId.value = ''
}

const handleReserveClick = (game: LibraryGame): void => {
  if (!game || getStatus(game) !== 'available') return

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    showAuthDialog.value = true
    return
  }

  // User is authenticated, show reservation confirmation
  selectedGameForReservation.value = game
  showReservationDialog.value = true
}

const confirmReservation = async (): Promise<void> => {
  if (!selectedGameForReservation.value) return

  try {
    loadingReservation.value = true
    await libraryReservationService.post(selectedGameForReservation.value.id)
    showReservationDialog.value = false
    selectedGameForReservation.value = null
    toast.success('Game reserved successfully!')
  } catch (error: unknown) {
    toast.error(error as string)
  } finally {
    loadingReservation.value = false
  }
}

const cancelReservation = (): void => {
  showReservationDialog.value = false
  selectedGameForReservation.value = null
}

const redirectToSignIn = (): void => {
  showAuthDialog.value = false
  void router.push({ name: RouteNames.auth.signIn })
}

const closeAuthDialog = (): void => {
  showAuthDialog.value = false
}

onMounted(async () => {
  isAuthenticated.value = !!(await authService.getUser())

  // Subscribe to realtime updates without filters - filters are applied reactively
  unsubscribe = libraryService.subscribeToUpdates((updatedGames) => {
    allGames.value = updatedGames
    loading.value = false
    // Setup intersection observer after data loads
    if (updatedGames.length > 0) {
      void nextTick(() => {
        setupIntersectionObserver()
      })
    }
  })
})

onUnmounted(() => {
  // Clean up subscription
  if (unsubscribe) {
    unsubscribe()
  }
  // Clean up intersection observer
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl md:max-w-7xl">
    <div
      class="grid grid-cols-2 gap-y-12 gap-x-6 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4 xl:gap-x-8"
    >
      <template v-if="loading">
        <GameItem :loading="true" />
        <GameItem :loading="true" />
        <GameItem :loading="true" />
        <GameItem :loading="true" />
      </template>
      <GameItem
        v-for="game in games"
        :key="game.id"
        :game="game"
        @game-click="openGameDetail"
        @reserve-game="handleReserveClick"
      />
    </div>

    <!-- Load more trigger element (invisible) -->
    <div
      v-if="hasMoreGames && !loading"
      ref="loadMoreTrigger"
      class="h-10 w-full"
    ></div>

    <!-- Loading more indicator -->
    <div v-if="hasMoreGames && !loading" class="mt-8 flex justify-center">
      <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        <svg
          class="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
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
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-sm">{{ t('library.loadingMoreGames') }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!loading && filteredGames.length === 0"
      class="text-center py-12"
    >
      <div class="mx-auto h-12 w-12 text-gray-400">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ t('library.noGamesFound') }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('library.noGamesFoundDescription') }}
      </p>
    </div>

    <!-- Game Detail Modal -->
    <DialogGameDetail
      v-if="selectedGameId"
      :game-id="selectedGameId"
      :open="isDetailModalOpen"
      @close="closeGameDetail"
    />

    <!-- Reservation Confirmation Dialog -->
    <ConfirmationDialog
      :open="showReservationDialog"
      :title="t('library.reserveGame')"
      :confirm-text="t('game.reserve')"
      :cancel-text="t('common.cancel')"
      :loading="loadingReservation"
      @confirm="confirmReservation"
      @cancel="cancelReservation"
      @close="cancelReservation"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ t('reservation.areYouSureReserve') }}
          <strong>{{ selectedGameForReservation?.game.name }}</strong
          >?
        </p>
        <div
          class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3"
        >
          <div class="text-sm text-purple-800 dark:text-purple-200">
            <p class="font-medium mb-1">{{ t('reservation.important') }}</p>
            <ul class="list-disc list-inside space-y-1">
              <li>
                {{ t('reservation.reservationValid') }}
                <strong>15 {{ t('reservation.minutes') }}</strong>
                <!--                TODO load this value from settings-->
              </li>
              <li>
                {{ t('reservation.oneReservationPerUser') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ConfirmationDialog>

    <!-- Authentication Required Dialog -->
    <ConfirmationDialog
      :open="showAuthDialog"
      :title="t('auth.authenticationRequired')"
      :confirm-text="t('auth.signIn')"
      :cancel-text="t('common.cancel')"
      @confirm="redirectToSignIn"
      @cancel="closeAuthDialog"
      @close="closeAuthDialog"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ t('auth.authenticationRequiredMessage') }}
        </p>
      </div>
    </ConfirmationDialog>
  </div>
</template>

<style scoped></style>
