<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  IconCalendar,
  IconMapPin,
  IconArrowDown,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { tenantStore } from '@/stores/tenant.js'
import { useI18n } from 'vue-i18n'
import { editionStore } from '@/stores/edition.js'
import PosterView from './PosterView.vue'
import { formatDateRange } from '@/utils/date.js'

const { t } = useI18n()

interface Props {
  conventionStatus: 'happening' | 'upcoming' | 'ended'
  countdown: { days: number; hours: number; minutes: number } | null
  primaryCta: {
    text: string
    route?: string
    href?: string
    icon: unknown
    style: string
  }
  scrollY: number
  useLogo?: boolean
  posterUrl?: string
}

interface Emits {
  (e: 'scrollTo', section: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Get logo from tenant store
const logoUrl = computed(() => {
  if (!tenantStore.value) return null
  // Prefer long logo for hero section, fallback to generic logo
  return tenantStore.value.logos?.long || tenantStore.value.logo || null
})

interface ViewportSize {
  width: number
  height: number
}

// Track viewport size for responsive hero behavior
const viewportSize = ref<ViewportSize>({
  width: 1280,
  height: 800,
})

function updateViewportSize(): void {
  viewportSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportSize)
})

// Whether we're on a mobile-sized viewport
const isMobile = computed(() => viewportSize.value.width < 768)

// Hero parallax effect — gentler on mobile
const heroTransform = computed(() => {
  const multiplier = isMobile.value ? 0.2 : 0.5
  const offset = props.scrollY * multiplier
  return `translateY(${offset}px)`
})

const heroOpacity = computed(() => {
  // Fade relative to viewport height so it works on any screen size
  const fadeDistance = viewportSize.value.height * (isMobile.value ? 1.2 : 0.8)
  const opacity = 1 - props.scrollY / fadeDistance
  return Math.max(0, Math.min(1, opacity))
})

function scrollToMap(): void {
  emit('scrollTo', 'map')
}
</script>

<template>
  <section
    id="hero"
    class="relative flex min-h-svh items-center justify-center overflow-hidden bg-gray-50 px-0 pb-16 pt-28 dark:bg-gray-950 sm:pb-20 sm:pt-32"
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
        :style="{
          transform: `translateY(${-props.scrollY * (isMobile ? 0.15 : 0.3)}px)`,
        }"
      />
      <div
        class="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-300/30 dark:bg-fuchsia-600/20 blur-3xl"
        :style="{
          transform: `translateY(${props.scrollY * (isMobile ? 0.1 : 0.2)}px)`,
        }"
      />

      <!-- Grid Pattern -->
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size[64px_64px]"
      />

      <!-- Board Game Elements -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
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
          class="absolute top-[40%] left-[5%] hidden animate-float-delayed opacity-12 dark:opacity-6 sm:block"
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
          class="absolute top-[35%] right-[8%] hidden animate-float opacity-15 dark:opacity-8 sm:block"
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
        <div
          class="absolute top-[80%] left-[25%] hidden opacity-10 dark:opacity-5 sm:block"
        >
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
          class="absolute bottom-[15%] left-[35%] hidden opacity-10 dark:opacity-5 sm:block"
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
      class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6"
      :style="{ opacity: heroOpacity }"
    >
      <div
        :class="[
          'flex items-center gap-6 lg:gap-12',
          posterUrl
            ? 'flex-col lg:flex-row lg:justify-between'
            : 'flex-col justify-center',
        ]"
      >
        <!-- Text Content -->
        <div
          :class="[
            posterUrl
              ? 'text-center lg:text-left lg:flex-1'
              : 'text-center w-full',
          ]"
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

          <!-- Logo Display -->
          <div v-if="useLogo && logoUrl" class="mb-8">
            <img
              :src="logoUrl"
              :alt="tenantStore?.name || 'Convention Logo'"
              class="mx-auto h-32 w-auto object-contain sm:h-40 lg:h-48"
              :class="{ 'lg:mx-0': posterUrl }"
            />
          </div>

          <!-- Main Title -->
          <h1
            v-else
            class="bg-linear-to-b from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:via-white dark:to-white/60 sm:text-5xl md:text-7xl"
            :class="posterUrl ? 'lg:text-6xl xl:text-7xl' : 'lg:text-8xl'"
          >
            {{ editionStore?.name || t('landing.hero.defaultTitle') }}
          </h1>

          <!-- Subtitle / Description -->
          <p
            v-if="!useLogo"
            class="mx-auto mt-5 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:mt-6 sm:text-xl lg:text-2xl"
            :class="{ 'lg:mx-0': posterUrl }"
          >
            {{
              tenantStore?.shortDescription ||
              t('landing.hero.defaultDescription')
            }}
          </p>

          <!-- Event Date & Location -->
          <div
            class="mt-7 flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6"
            :class="
              posterUrl ? 'justify-center lg:justify-start' : 'justify-center'
            "
          >
            <div class="flex items-center gap-2">
              <IconCalendar
                class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              />
              <span>{{
                formatDateRange(
                  editionStore?.start_date,
                  editionStore?.end_date,
                  useI18n().locale.value,
                )
              }}</span>
            </div>
            <button
              v-if="editionStore?.location?.title"
              type="button"
              class="group inline-flex"
              @click="scrollToMap"
            >
              <div class="flex items-center gap-2">
                <IconMapPin
                  class="h-5 w-5 text-indigo-600 transition-transform group-hover:-translate-y-0.5 dark:text-indigo-400"
                />
                <span>{{ editionStore.location.title }}</span>
              </div>
            </button>
          </div>

          <!-- Poster (mobile/tablet, before CTA) -->
          <div v-if="posterUrl" class="mt-8 w-56 shrink-0 sm:w-72 lg:hidden">
            <PosterView
              :poster-url="posterUrl"
              :edition-name="editionStore?.name"
            />
          </div>

          <!-- Primary CTA -->
          <div
            class="mt-10 flex w-full flex-col items-center gap-4 sm:mt-12 sm:flex-row"
            :class="
              posterUrl
                ? 'sm:justify-center lg:justify-start'
                : 'sm:justify-center'
            "
          >
            <RouterLink
              v-if="primaryCta.route"
              :to="{ name: primaryCta.route }"
              :class="[
                'group inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-semibold shadow-lg transition-all duration-300 sm:w-auto sm:px-8 sm:py-4 sm:text-lg',
                primaryCta.style === 'live'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/25'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-gray-900/25 dark:hover:shadow-white/25',
              ]"
            >
              <component :is="primaryCta.icon" class="h-6 w-6" />
              {{ primaryCta.text }}
              <IconArrowRight
                class="h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </RouterLink>
            <a
              v-else-if="primaryCta.href"
              :href="primaryCta.href"
              class="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              <component :is="primaryCta.icon" class="h-6 w-6" />
              {{ primaryCta.text }}
              <IconArrowRight
                class="h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>

        <!-- Poster (right side on lg, below CTA on mobile) -->
        <div
          v-if="posterUrl"
          class="hidden w-56 shrink-0 sm:w-72 lg:block lg:w-72 xl:w-80"
        >
          <PosterView
            :poster-url="posterUrl"
            :edition-name="editionStore?.name"
          />
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <button
      class="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce text-gray-400 transition-colors hover:text-gray-900 dark:text-white/60 dark:hover:text-white md:inline-flex"
      aria-label="Scroll down"
      @click="scrollToMap"
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
