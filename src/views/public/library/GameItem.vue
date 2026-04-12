<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import {
  getStatusColor,
  getStatusLabel,
  getStatus,
} from '@/features/library/games/game.model.ts'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { HandRaisedIcon } from '@heroicons/vue/24/outline'
import CButton from '@/components/CButton.vue'
import { editionStore } from '@/stores/edition.ts'

interface Props {
  game?: LibraryGame
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  game: undefined,
})

const emit = defineEmits<{
  'game-click': [gameId: number]
  'reserve-game': [game: LibraryGame]
}>()

const { t } = useI18n()
const imageLoaded = ref(false)
const imageError = ref(false)

// Watch for game changes and reset image state
watch(
  () => props.game?.id,
  () => {
    imageLoaded.value = false
    imageError.value = false
  },
)

// Handle image load success
const handleImageLoad = (): void => {
  imageLoaded.value = true
  imageError.value = false
}

// Handle image load error
const handleImageError = (): void => {
  imageLoaded.value = true
  imageError.value = true
}

const handleGameClick = (): void => {
  if (props.game) {
    emit('game-click', props.game.id)
  }
}

const reserveGame = (): void => {
  if (props.game) {
    emit('reserve-game', props.game)
  }
}

// Image height classes for responsive design
// Grid layout: 2 cols (mobile) → 3 cols (sm) → 4 cols (lg)
// Heights chosen to maintain roughly square aspect ratio at each breakpoint
const imageHeightClasses = computed(() => {
  return 'h-60 md:h-55 lg:h-55'
})

// Check if convention is currently happening
const isConventionHappening = computed(() => {
  const edition = editionStore.value
  if (!edition?.start_date || !edition?.end_date) {
    return false
  }

  const now = new Date()
  const startDate = new Date(edition.start_date)
  const endDate = new Date(edition.end_date)

  // Set time to start/end of day for accurate comparison
  now.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  return now >= startDate && now <= endDate
})
</script>

<template>
  <div>
    <!-- Loading SkeletonLoader -->
    <div v-if="loading">
      <div class="group relative">
        <div
          :class="[
            'relative w-full overflow-hidden rounded-lg',
            imageHeightClasses,
          ]"
        >
          <SkeletonLoader width="100%" height="100%" />
        </div>
        <div class="mt-4 space-y-2">
          <div class="text-center">
            <SkeletonLoader width="60px" height="16px" class="mx-auto" />
          </div>
          <div class="text-center">
            <SkeletonLoader width="80%" height="20px" class="mx-auto" />
          </div>
        </div>
      </div>
      <div class="mt-6">
        <SkeletonLoader width="100%" height="38px" />
      </div>
    </div>

    <!-- Game Content -->
    <div v-else-if="game">
      <div class="group relative cursor-pointer" @click="handleGameClick">
        <div
          :class="[
            'relative w-full overflow-hidden rounded-lg text-center',
            imageHeightClasses,
          ]"
        >
          <!-- Image SkeletonLoader - shown while image is loading -->
          <SkeletonLoader
            v-if="!imageLoaded"
            width="100%"
            height="100%"
            class="absolute inset-0 rounded-lg"
          />

          <!-- Actual Image -->
          <img
            v-if="!imageError"
            :src="game.game.image"
            :alt="t('game.coverImage', { name: game.game.name })"
            loading="lazy"
            decoding="async"
            :class="[
              'size-full object-cover transition-all duration-300 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0',
            ]"
            @load="handleImageLoad"
            @error="handleImageError"
          />

          <!-- Fallback for broken images -->
          <div
            v-if="imageError"
            class="size-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg"
          >
            <div class="text-center text-gray-500 dark:text-gray-400">
              <svg
                class="w-12 h-12 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clip-rule="evenodd"
                />
              </svg>
              <p class="text-xs">{{ t('game.imageUnavailable') }}</p>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            {{ game.game.year }}
          </p>
          <h3
            class="mt-1 font-semibold text-gray-900 dark:text-white text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
          >
            <span class="absolute inset-0" />
            {{ game.game.name }}
          </h3>
        </div>
        <div
          v-if="getStatus(game) !== 'available' && isConventionHappening"
          :class="[
            'absolute inset-x-0 top-0 flex items-end justify-end overflow-hidden rounded-lg p-4',
            imageHeightClasses,
          ]"
        >
          <div
            aria-hidden="true"
            :class="[
              'absolute inset-x-0 bottom-0 h-40 bg-linear-to-t opacity-100',
              getStatusColor(game),
            ]"
          />

          <p class="relative text-lg text-shadow-lg font-semibold text-gray-50">
            {{ getStatusLabel(game) }}
          </p>
        </div>
      </div>
      <div v-if="isConventionHappening" class="mt-6">
        <CButton
          :full-width="true"
          variant="tertiary"
          :disabled="getStatus(game) !== 'available'"
          @click="reserveGame"
          ><HandRaisedIcon class="size-4" />{{ t('game.reserve') }}</CButton
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
