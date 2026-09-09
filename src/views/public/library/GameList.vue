<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getStatus,
  type LibraryGame,
} from '@/features/library/games/game.model.ts'
import {
  type FilterOptions,
  libraryService,
} from '@/features/library/games/service.ts'
import { useLibraryGames } from '@/features/library/games/useLibraryGames'
import GameItem from './GameItem.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import libraryReservationService from '@/features/library/reservations/service.ts'
import { toast } from 'vue-sonner'
import { authService } from '@/features/auth/service.ts'
import DialogGameDetail from '@/views/public/library/DialogGameDetail.vue'
import { RouteNames } from '@/router/routeNames.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const selectedGameId = ref<string>('')
const isDetailModalOpen = ref(false)
const loadedPages = ref(1)
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

// The same fetch `PageLibraryHome` reads; `useAsyncData`'s shared key makes the
// two calls one request. Seeded into a ref here because the realtime
// subscription replaces the list from mount onwards.
const renderedGames = await useLibraryGames()
const allGames = ref<LibraryGame[]>(renderedGames.value)

// Watch for filter changes and reset pagination
watch(
  () => props.filters,
  () => {
    resetPagination()
  },
  { deep: true },
)

/**
 * Which page of the library this URL is.
 *
 * Infinite scroll shows a crawler the first twenty games and nothing else —
 * it does not scroll. `?page=N` gives every twenty a URL of its own that the
 * server renders, and the links at the bottom of the list are how a crawler
 * gets to them. Step 7 item 5 of `docs/ssr-migration.md`.
 *
 * For a person nothing changes: the page they land on is the start of the
 * list, and scrolling still appends the next twenty to it.
 */
const startPage = computed(() => {
  const raw = route.query.page
  const asked = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(asked) && asked > 1 ? asked : 1
})

const startIndex = computed(() => (startPage.value - 1) * itemsPerPage.value)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredGames.value.length / itemsPerPage.value)),
)

// What is on screen: the window this URL names, plus whatever scrolling has
// appended to it since.
const games = computed(() =>
  filteredGames.value.slice(
    startIndex.value,
    startIndex.value + loadedPages.value * itemsPerPage.value,
  ),
)

// Check if there are more games to load
const hasMoreGames = computed(
  () => startIndex.value + games.value.length < filteredGames.value.length,
)

const loadMoreGames = (): void => {
  if (hasMoreGames.value) {
    loadedPages.value++
  }
}

const resetPagination = (): void => {
  loadedPages.value = 1
  setupIntersectionObserver()
}

// Moving between pages starts a fresh window rather than keeping the previous
// page's appended games on screen.
watch(startPage, () => {
  resetPagination()
})

const setupIntersectionObserver = (): void => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry && entry.isIntersecting && hasMoreGames.value) {
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
  const tenantId = tenantStore.tenant?.id
  const editionId = editionStore.edition?.id
  if (!selectedGameForReservation.value || !tenantId || !editionId) return

  try {
    loadingReservation.value = true
    await libraryReservationService.post(
      tenantId,
      editionId,
      selectedGameForReservation.value.id,
    )
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
  // The games are already on the page, so what is left for the browser is the
  // part a server render cannot have: who the visitor is, the observer that
  // pages the list, and the subscription that keeps it current.
  if (allGames.value.length > 0) setupIntersectionObserver()

  const tenantId = tenantStore.tenant?.id
  const editionId = editionStore.edition?.id
  if (!tenantId || !editionId) return

  isAuthenticated.value = !!(await authService.getUser(tenantId))

  // Subscribe to realtime updates without filters - filters are applied reactively
  unsubscribe = libraryService.subscribeToUpdates(
    tenantId,
    editionId,
    (updatedGames) => {
      allGames.value = updatedGames
      // Setup intersection observer after data loads
      if (updatedGames.length > 0) {
        void nextTick(() => {
          setupIntersectionObserver()
        })
      }
    },
    // The first list came from the render.
    { loadInitial: false },
  )
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
  <!-- Fills whatever column it is given: from lg up that is the three quarters
       left over by the pinned filters, not the whole page -->
  <div class="w-full">
    <div
      class="grid grid-cols-2 gap-y-12 gap-x-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8"
    >
      <GameItem
        v-for="game in games"
        :key="game.id"
        :game="game"
        @game-click="openGameDetail"
        @reserve-game="handleReserveClick"
      />
    </div>

    <!-- Load more trigger element (invisible) -->
    <div v-if="hasMoreGames" ref="loadMoreTrigger" class="h-10 w-full"></div>

    <!-- Loading more indicator -->
    <div v-if="hasMoreGames" class="mt-8 flex justify-center">
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
        <span class="text-sm">{{ t('public.library.loadingMoreGames') }}</span>
      </div>
    </div>

    <!--
      Real links, one per page of the library, so a crawler can reach the games
      that scrolling would otherwise be the only way to see. Quiet on purpose:
      a visitor scrolls, and this is below where they will ever have to.
    -->
    <nav
      v-if="totalPages > 1"
      :aria-label="t('public.library.pagination.label')"
      class="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      <RouterLink
        v-for="page in totalPages"
        :key="page"
        :to="page === 1 ? { query: {} } : { query: { page } }"
        class="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        :class="
          page === startPage
            ? 'bg-gray-100 font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : ''
        "
        :aria-current="page === startPage ? 'page' : undefined"
      >
        {{ page }}
      </RouterLink>
    </nav>

    <!-- Empty state -->
    <div v-if="filteredGames.length === 0" class="text-center py-12">
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
        {{ t('public.library.noGamesFound') }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('public.library.noGamesFoundDescription') }}
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
      :title="t('public.library.reserveGame')"
      :confirm-text="t('public.game.reserve')"
      :cancel-text="t('common.actions.cancel')"
      :loading="loadingReservation"
      @confirm="confirmReservation"
      @cancel="cancelReservation"
      @close="cancelReservation"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ t('public.reservation.areYouSureReserve') }}
          <strong>{{ selectedGameForReservation?.game.name }}</strong
          >?
        </p>
        <div
          class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3"
        >
          <div class="text-sm text-purple-800 dark:text-purple-200">
            <p class="font-medium mb-1">
              {{ t('public.reservation.important') }}
            </p>
            <ul class="list-disc list-inside space-y-1">
              <li>
                {{ t('public.reservation.reservationValid') }}
                <strong>15 {{ t('public.reservation.minutes') }}</strong>
                <!--                TODO load this value from settings-->
              </li>
              <li>
                {{ t('public.reservation.oneReservationPerUser') }}
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
      :cancel-text="t('common.actions.cancel')"
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
