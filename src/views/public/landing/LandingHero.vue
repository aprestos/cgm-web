<script setup lang="ts">
import { computed } from 'vue'
import {
  IconCalendar,
  IconMapPin,
  IconArrowDown,
  IconArrowRight,
  IconChevronRight,
  IconSparkles,
} from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { tenantStore } from '@/stores/tenant.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  editionName?: string
  tenantName?: string
  startDate?: string
  endDate?: string
  locationTitle?: string
  conventionStatus: 'happening' | 'upcoming' | 'ended'
  countdown: { days: number; hours: number; minutes: number } | null
  primaryCTA: {
    text: string
    route?: string
    href?: string
    icon: unknown
    style: string
  }
  scrollY: number
}

interface Emits {
  (e: 'scrollTo', section: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Hero parallax effect
const heroTransform = computed(() => {
  const offset = props.scrollY * 0.5
  return `translateY(${offset}px)`
})

const heroOpacity = computed(() => {
  const opacity = 1 - props.scrollY / 600
  return Math.max(0, Math.min(1, opacity))
})

function formatShortDate(dateString: string | undefined): string {
  if (!dateString) return 'TBA'
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <section
    id="hero"
    class="relative flex min-h-screen items-center justify-center overflow-hidden"
  >
    <!-- Animated Background -->
    <div class="absolute inset-0">
      <!-- Gradient Orbs -->
      <div
        class="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-300/40 dark:bg-violet-600/30 blur-3xl"
        :style="{ transform: heroTransform }"
      />
      <div
        class="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-300/50 dark:bg-indigo-600/40 blur-3xl"
        :style="{ transform: `translateY(${-props.scrollY * 0.3}px)` }"
      />
      <div
        class="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-300/30 dark:bg-fuchsia-600/20 blur-3xl"
        :style="{ transform: `translateY(${props.scrollY * 0.2}px)` }"
      />

      <!-- Grid Pattern -->
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <!-- Board Game Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Floating Dice -->
        <div
          class="absolute top-[15%] left-[10%] animate-float opacity-20 dark:opacity-10"
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-indigo-600 dark:text-indigo-400"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              stroke-width="1.5"
              fill="currentColor"
              fill-opacity="0.1"
            />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
            <circle cx="8" cy="16" r="1.5" fill="currentColor" />
            <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <!-- Meeple 1 -->
        <div
          class="absolute top-[25%] right-[15%] animate-float-delayed opacity-15 dark:opacity-8"
          style="animation-delay: 1s"
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-violet-600 dark:text-violet-400"
          >
            <circle cx="12" cy="6" r="3" fill="currentColor" />
            <path
              d="M6 11c0-1.5 1-2 2-2h8c1 0 2 .5 2 2v2c0 1-1 2-2 2h-1v5c0 1-.5 2-2 2s-2-1-2-2v-5H9c-1 0-2-1-2-2v-2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <!-- Playing Card -->
        <div
          class="absolute top-[60%] left-[8%] animate-float opacity-15 dark:opacity-8"
          style="animation-delay: 2s"
        >
          <svg
            width="45"
            height="55"
            viewBox="0 0 24 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-rose-500 dark:text-rose-400"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="28"
              rx="2"
              stroke="currentColor"
              stroke-width="1.5"
              fill="white"
              fill-opacity="0.9"
            />
            <path
              d="M12 8c-2 0-3.5 1.5-3.5 3.5S10 15 12 15s3.5-1.5 3.5-3.5S14 8 12 8z"
              fill="currentColor"
            />
            <text x="4" y="8" font-size="6" fill="currentColor">A</text>
          </svg>
        </div>

        <!-- Dice 2 -->
        <div
          class="absolute bottom-[20%] right-[12%] animate-float opacity-20 dark:opacity-10"
          style="animation-delay: 0.5s"
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-amber-600 dark:text-amber-400"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              stroke-width="1.5"
              fill="currentColor"
              fill-opacity="0.1"
            />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="15" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <!-- Token/Coin -->
        <div
          class="absolute top-[70%] right-[20%] animate-float-delayed opacity-15 dark:opacity-8"
          style="animation-delay: 1.5s"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-yellow-600 dark:text-yellow-500"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="2"
              fill="currentColor"
              fill-opacity="0.2"
            />
            <circle
              cx="12"
              cy="12"
              r="6"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <text
              x="12"
              y="15"
              text-anchor="middle"
              font-size="8"
              font-weight="bold"
              fill="currentColor"
            >
              $
            </text>
          </svg>
        </div>

        <!-- Meeple 2 -->
        <div
          class="absolute bottom-[30%] left-[18%] animate-float opacity-15 dark:opacity-8"
          style="animation-delay: 2.5s"
        >
          <svg
            width="45"
            height="45"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-emerald-600 dark:text-emerald-400"
          >
            <circle cx="12" cy="6" r="3" fill="currentColor" />
            <path
              d="M6 11c0-1.5 1-2 2-2h8c1 0 2 .5 2 2v2c0 1-1 2-2 2h-1v5c0 1-.5 2-2 2s-2-1-2-2v-5H9c-1 0-2-1-2-2v-2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <!-- Board Game Box -->
        <div
          class="absolute top-[40%] left-[5%] animate-float-delayed opacity-12 dark:opacity-6"
          style="animation-delay: 3s"
        >
          <svg
            width="55"
            height="55"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-indigo-700 dark:text-indigo-300"
          >
            <rect
              x="2"
              y="4"
              width="20"
              height="16"
              rx="1"
              stroke="currentColor"
              stroke-width="1.5"
              fill="currentColor"
              fill-opacity="0.1"
            />
            <rect
              x="4"
              y="6"
              width="16"
              height="3"
              fill="currentColor"
              fill-opacity="0.3"
            />
            <rect
              x="6"
              y="11"
              width="4"
              height="4"
              rx="0.5"
              fill="currentColor"
              fill-opacity="0.4"
            />
            <rect
              x="11"
              y="11"
              width="7"
              height="1.5"
              rx="0.5"
              fill="currentColor"
              fill-opacity="0.3"
            />
            <rect
              x="11"
              y="13.5"
              width="5"
              height="1.5"
              rx="0.5"
              fill="currentColor"
              fill-opacity="0.3"
            />
          </svg>
        </div>

        <!-- Hexagon Tile -->
        <div
          class="absolute top-[35%] right-[8%] animate-float opacity-15 dark:opacity-8"
          style="animation-delay: 1.8s"
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-teal-600 dark:text-teal-400"
          >
            <path
              d="M12 2L20 7v10l-8 5-8-5V7l8-5z"
              stroke="currentColor"
              stroke-width="1.5"
              fill="currentColor"
              fill-opacity="0.1"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              fill="currentColor"
              fill-opacity="0.3"
            />
          </svg>
        </div>

        <!-- Small Dice scattered -->
        <div class="absolute top-[80%] left-[25%] opacity-10 dark:opacity-5">
          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-gray-600 dark:text-gray-400"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
              fill="currentColor"
              fill-opacity="0.2"
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>

        <div
          class="absolute bottom-[15%] left-[35%] opacity-10 dark:opacity-5"
          style="animation-delay: 0.7s"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-gray-600 dark:text-gray-400"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
              fill="currentColor"
              fill-opacity="0.2"
            />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="15" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Hero Content -->
    <div
      class="relative z-10 mx-auto max-w-7xl px-4 text-center"
      :style="{ opacity: heroOpacity }"
    >
      <!-- Live Badge -->
      <div
        v-if="conventionStatus === 'happening'"
        class="mb-8 inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-500/30"
      >
        <span class="relative flex h-2 w-2">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75"
          />
          <span
            class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
          />
        </span>
        {{ t('landing.hero.liveNow') }}
      </div>

      <!-- Upcoming Badge -->
      <div
        v-else-if="countdown"
        class="mb-8 inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-500/30"
      >
        <IconSparkles class="h-4 w-4" />
        {{ t('landing.hero.comingSoon') }}
      </div>

      <!-- Main Title -->
      <h1
        class="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-white dark:to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl lg:text-8xl"
      >
        {{ editionName || tenantName || t('landing.hero.defaultTitle') }}
      </h1>

      <!-- Subtitle / Description -->
      <p
        class="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl lg:text-2xl"
      >
        {{
          tenantStore?.short_description || t('landing.hero.defaultDescription')
        }}
      </p>

      <!-- Event Date & Location -->
      <div
        class="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400"
      >
        <div class="flex items-center gap-2">
          <IconCalendar class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>{{ formatShortDate(startDate) }}</span>
          <span v-if="endDate"> - {{ formatShortDate(endDate) }} </span>
        </div>
        <div v-if="locationTitle" class="flex items-center gap-2">
          <IconMapPin class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>{{ locationTitle }}</span>
        </div>
      </div>

      <!-- Primary CTA -->
      <div
        class="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <RouterLink
          v-if="primaryCTA.route"
          :to="{ name: primaryCTA.route }"
          :class="[
            'group inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300',
            primaryCTA.style === 'live'
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/25'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-gray-900/25 dark:hover:shadow-white/25',
          ]"
        >
          <component :is="primaryCTA.icon" class="h-6 w-6" />
          {{ primaryCTA.text }}
          <IconArrowRight
            class="h-5 w-5 transition-transform group-hover:translate-x-1"
          />
        </RouterLink>
        <a
          v-else-if="primaryCTA.href"
          :href="primaryCTA.href"
          class="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25"
        >
          <component :is="primaryCTA.icon" class="h-6 w-6" />
          {{ primaryCTA.text }}
          <IconArrowRight
            class="h-5 w-5 transition-transform group-hover:translate-x-1"
          />
        </a>

        <a
          href="#map"
          class="inline-flex items-center gap-2 rounded-full px-6 py-4 text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          {{ t('landing.hero.discoverMore') }}
          <IconChevronRight class="h-5 w-5" />
        </a>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <button
      class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-400 dark:text-white/60 transition-colors hover:text-gray-900 dark:hover:text-white"
      aria-label="Scroll down"
      @click="emit('scrollTo', 'map')"
    >
      <IconArrowDown class="h-8 w-8" />
    </button>
  </section>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
  }
  50% {
    transform: translateY(-10px) rotate(-5deg);
  }
  75% {
    transform: translateY(-15px) rotate(3deg);
  }
}

@keyframes float-delayed {
  0%,
  100% {
    transform: translateY(0) rotate(0deg) translateX(0);
  }
  33% {
    transform: translateY(-15px) rotate(-5deg) translateX(10px);
  }
  66% {
    transform: translateY(-25px) rotate(5deg) translateX(-10px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
}
</style>
