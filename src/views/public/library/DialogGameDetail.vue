<template>
  <DialogComponent title="" size="lg" :open="open" @close="closeModal">
    <!-- Loading SkeletonLoader -->
    <div
      v-if="!game"
      class="grid w-full grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-12 lg:gap-x-8"
    >
      <div class="sm:col-span-4 lg:col-span-5">
        <SkeletonLoader width="100%" height="300px" />
      </div>
      <div class="sm:col-span-8 lg:col-span-7">
        <SkeletonLoader width="70%" height="32px" class="mb-3" />

        <section aria-labelledby="information-heading" class="mt-3">
          <!-- Game Stats Skeletons -->
          <div class="space-y-3">
            <!-- Player Count SkeletonLoader -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UsersIcon class="h-5 w-5 text-gray-400" />
                <SkeletonLoader width="100px" height="20px" />
              </div>
              <div class="ml-7 flex items-center gap-1">
                <SkeletonLoader width="200px" height="8px" />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <ClockIcon class="h-5 w-5 text-gray-400" />
              <SkeletonLoader width="80px" height="20px" />
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon class="h-5 w-5 text-gray-400" />
              <SkeletonLoader width="60px" height="20px" />
            </div>
          </div>

          <!-- Description SkeletonLoader -->
          <div class="mt-6">
            <div class="flex items-center gap-2 mb-2">
              <DocumentTextIcon class="h-5 w-5 text-gray-400" />
              <SkeletonLoader width="100px" height="20px" />
            </div>
            <div class="space-y-2">
              <SkeletonLoader width="100%" height="16px" />
              <SkeletonLoader width="100%" height="16px" />
              <SkeletonLoader width="80%" height="16px" />
            </div>
          </div>
        </section>

        <section aria-labelledby="options-heading" class="mt-6">
          <div class="mt-6">
            <SkeletonLoader width="100%" height="48px" />
          </div>
        </section>
      </div>
    </div>

    <!-- Game Content -->
    <div
      v-else
      class="grid w-full grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-12 lg:gap-x-8"
    >
      <div class="sm:col-span-4 lg:col-span-5">
        <img
          :src="game?.game?.image || ''"
          :alt="game?.game?.name || ''"
          class="w-full rounded-lg bg-gray-100 object-contain"
        />
      </div>
      <div class="sm:col-span-8 lg:col-span-7">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white sm:pr-12">
          {{ game?.game?.name }}
        </h2>

        <section aria-labelledby="information-heading" class="mt-3">
          <h3 id="information-heading" class="sr-only">
            {{ t('game.detail.productInformation') }}
          </h3>

          <!-- Game Stats with Icons -->
          <div class="space-y-3">
            <!-- Player Count with Visual Indicators -->
            <div class="space-y-2">
              <div
                class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
              >
                <IconUsers class="h-5 w-5 text-gray-400" />
                <span
                  >{{
                    getRange(game?.game?.minPlayers, game?.game?.maxPlayers)
                  }}
                  {{ t('game.detail.players') }}</span
                >
              </div>

              <!-- Player Count Visual Bar -->
              <div v-if="game?.game" class="ml-7 flex items-center gap-1">
                <template v-for="count in getPlayerCountRange()" :key="count">
                  <div
                    :class="[
                      'w-6 h-2 rounded-sm transition-colors',
                      getPlayerCountClass(count),
                    ]"
                    :title="getPlayerCountTooltip(count)"
                  />
                </template>

                <!-- Legend -->
                <div
                  class="ml-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  <div
                    v-if="game?.game?.bestAt"
                    class="flex items-center gap-1"
                  >
                    <div class="w-2 h-2 rounded-sm bg-green-500"></div>
                    <span>{{ t('game.detail.best') }}</span>
                  </div>
                  <div
                    v-if="game?.game?.recommendedAt"
                    class="flex items-center gap-1"
                  >
                    <div class="w-2 h-2 rounded-sm bg-blue-300"></div>
                    <span>{{ t('game.detail.good') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <ClockIcon class="h-5 w-5 text-gray-400" />
              <span
                >{{
                  getRange(game?.game?.minPlaytime, game?.game?.maxPlaytime)
                }}
                {{ t('game.detail.min') }}</span
              >
            </div>
            <div
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <CalendarIcon class="h-5 w-5 text-gray-400" />
              <span>{{ t('game.detail.age') }} {{ game?.game?.minAge }}+</span>
            </div>
            <div
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <IconWorld class="h-5 w-5 text-gray-400" />
              <span>{{
                t(
                  'game.detail.languageDependence.' +
                    game?.game?.languageDependence,
                )
              }}</span>
            </div>
          </div>

          <!-- Description -->
          <div class="mt-6 hidden">
            <h4
              class="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-2"
            >
              <DocumentTextIcon class="h-5 w-5 text-gray-400" />
              {{ t('game.detail.description') }}
            </h4>
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ t('game.detail.notAvailable') }}
            </p>
          </div>
          <!-- BGG Link -->
          <div class="mt-4">
            <a
              :href="
                game?.game?.bggId
                  ? `https://boardgamegeek.com/boardgame/${game.game.bggId}`
                  : 'https://boardgamegeek.com/'
              "
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <IconWorld class="h-4 w-4" />
              <span>{{ t('game.detail.viewOnBGG') }}</span>
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogComponent from '@/components/DialogComponent.vue'
import {
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/vue/20/solid'
import { IconWorld, IconUsers } from '@tabler/icons-vue'
import libraryService from '@/features/library/games/service.ts'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const { t } = useI18n()

interface Props {
  gameId: string
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
})

const emit = defineEmits<{
  close: []
}>()

const game = ref<LibraryGame | null>(null)
const open = ref(props.open)

// Watch for open prop changes
watch(
  () => props.open,
  (newValue) => {
    open.value = newValue
  },
)

const fetchGame = async (): Promise<void> => {
  if (props.gameId) {
    game.value = await libraryService.getById(props.gameId)
  }
}

onMounted(async () => {
  await fetchGame()
})

const closeModal = (): void => {
  open.value = false
  emit('close')
}

const getRange = (min: number, max: number): string => {
  if (!min) return String(max)
  if (!max) return String(min)
  if (min === max) {
    return `${min}`
  } else {
    return `${min} - ${max}`
  }
}

// Player count visualization helpers
const getPlayerCountRange = (): number[] => {
  if (!game.value?.game) return []
  const min = game.value.game.minPlayers
  const max = game.value.game.maxPlayers
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

const getPlayerCountClass = (count: number): string => {
  if (!game.value?.game) return 'bg-gray-200'

  const bestAt = parseBestAt(game.value.game.bestAt)
  const recommendedAt = parseRecommendedAt(game.value.game.recommendedAt)

  if (bestAt.includes(count)) {
    return 'bg-green-500'
  } else if (recommendedAt.includes(count)) {
    return 'bg-blue-300'
  } else {
    return 'bg-gray-200'
  }
}

const getPlayerCountTooltip = (count: number): string => {
  if (!game.value?.game) return `${count} ${t('game.detail.players')}`

  const bestAt = parseBestAt(game.value.game.bestAt)
  const recommendedAt = parseRecommendedAt(game.value.game.recommendedAt)

  if (bestAt.includes(count)) {
    return `${count} ${t('game.detail.players')} - ${t('game.detail.best')}`
  } else if (recommendedAt.includes(count)) {
    return `${count} ${t('game.detail.players')} - ${t('game.detail.recommended')}`
  } else {
    return `${count} ${t('game.detail.players')} - ${t('game.detail.playable')}`
  }
}

// Parse best_at (usually single values like "3" or comma-separated like "3,5")
const parseBestAt = (bestAt?: string): number[] => {
  if (!bestAt) return []
  return bestAt.split(',').map((n) => parseInt(n.trim()))
}

// Parse recommended_at (usually ranges like "3-4" or comma-separated ranges like "2,4-6")
const parseRecommendedAt = (recommendedAt?: string): number[] => {
  if (!recommendedAt) return []

  const result: number[] = []

  // Handle the most common case: simple range like "3-4" or "3–4" (em dash)
  const hasHyphen = recommendedAt.includes('-')
  const hasEmDash = recommendedAt.includes('–')

  if ((hasHyphen || hasEmDash) && !recommendedAt.includes(',')) {
    const separator = hasEmDash ? '–' : '-'
    const [startStr, endStr] = recommendedAt.split(separator)
    if (!startStr || !endStr) return []
    const start = parseInt(startStr.trim())
    const end = parseInt(endStr.trim())

    if (!isNaN(start) && !isNaN(end) && start <= end) {
      for (let i = start; i <= end; i++) {
        result.push(i)
      }
    }
    return result
  }

  // Handle comma-separated values and ranges
  const parts = recommendedAt.split(',')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-') || trimmed.includes('–')) {
      // Handle range like "3-4" or "3–4"
      const separator = trimmed.includes('–') ? '–' : '-'
      const [startStr, endStr] = trimmed.split(separator)
      if (!startStr || !endStr) continue
      const start = parseInt(startStr.trim())
      const end = parseInt(endStr.trim())

      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          result.push(i)
        }
      }
    } else {
      // Handle single number like "2"
      const num = parseInt(trimmed)
      if (!isNaN(num)) {
        result.push(num)
      }
    }
  }

  return result
}
</script>
