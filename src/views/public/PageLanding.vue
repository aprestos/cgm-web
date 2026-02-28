<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { editionStore } from '@/stores/edition.ts'
import { settingsStore } from '@/features/settings/useSettings.store.ts'
import {
  IconBooks,
  IconUsers,
  IconTicket,
  IconTrophy,
  IconShoppingBag,
} from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/game.model.ts'
import { libraryService } from '@/features/library/service.ts'
import type { Ticket } from '@/features/tickets/ticket.model.ts'
import { ticketService } from '@/features/tickets/service.ts'

// Components
import LandingNavDots from './landing/LandingNavDots.vue'
import LandingHeader from './landing/LandingHeader.vue'
import LandingHero from './landing/LandingHero.vue'
import LandingGallery from './landing/LandingGallery.vue'
import LandingTickets from './landing/LandingTickets.vue'
import LandingCountdown from './landing/LandingCountdown.vue'
import LandingFeatures from './landing/LandingFeatures.vue'
import LandingGames from './landing/LandingGames.vue'
import LandingMap from './landing/LandingMap.vue'
import LandingCta from './landing/LandingCta.vue'
import LandingFooter from './landing/LandingFooter.vue'

const { t } = useI18n()

// Stores
const edition = computed(() => editionStore.value)
const tenant = computed(() => tenantStore.value)
const settings = computed(() => settingsStore.value)

// Convention gallery images (tenant images take priority, fallback to defaults)
const galleryImages = computed(() => {
  const tenantImages = tenant.value?.images ?? []
  if (tenantImages.length > 0) {
    return tenantImages
  }
  return []
})

// Data
const trendingGames = ref<LibraryGame[]>([])
const availableTickets = ref<Ticket[]>([])
const isLoadingGames = ref<boolean>(true)
const scrollY = ref<number>(0)
const activeSection = ref<string>('hero')

// Computed
const isTicketsEnabled = computed(
  () => settings.value?.tickets?.enabled ?? false,
)
const isLibraryEnabled = computed(
  () => settings.value?.library?.enabled ?? false,
)
const isTournamentsEnabled = computed(
  () => settings.value?.tournaments?.enabled ?? false,
)
const isFleaEnabled = computed(() => settings.value?.flea?.enabled ?? false)

const activeTickets = computed(() =>
  availableTickets.value.filter((ticket) => {
    if (!ticket.active) return false
    const now = new Date()
    if (ticket.sale_from && new Date(ticket.sale_from) > now) return false
    return !(ticket.sale_until && new Date(ticket.sale_until) < now)
  }),
)

// Convention status
const conventionStatus = computed((): 'happening' | 'upcoming' | 'ended' => {
  const now = new Date()
  const startDate = edition.value?.start_date
    ? new Date(edition.value.start_date)
    : null
  const endDate = edition.value?.end_date
    ? new Date(edition.value.end_date)
    : null

  if (startDate && endDate) {
    if (now >= startDate && now <= endDate) {
      return 'happening'
    } else if (now < startDate) {
      return 'upcoming'
    } else {
      return 'ended'
    }
  }
  return 'upcoming'
})

// Dynamic CTA based on convention status
const primaryCTA = computed(() => {
  if (conventionStatus.value === 'happening') {
    if (isLibraryEnabled.value) {
      return {
        text: 'Enter the Library',
        route: RouteNames.public.library,
        icon: IconBooks,
        style: 'live',
      }
    }
  }

  if (isTicketsEnabled.value && activeTickets.value.length > 0) {
    return {
      text: 'Get Your Tickets',
      href: '#tickets',
      icon: IconTicket,
      style: 'tickets',
    }
  }

  if (isLibraryEnabled.value) {
    return {
      text: 'Explore the Library',
      route: RouteNames.public.library,
      icon: IconBooks,
      style: 'default',
    }
  }

  return {
    text: 'Join the Community',
    route: RouteNames.auth.signIn,
    icon: IconUsers,
    style: 'default',
  }
})

// Countdown to event
const countdown = computed(() => {
  const startDate = edition.value?.start_date
    ? new Date(edition.value.start_date)
    : null
  if (!startDate) return null

  const now = new Date()
  const diff = startDate.getTime() - now.getTime()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes }
})

// Location map URL
const mapEmbedUrl = computed(() => {
  const location = edition.value?.location?.title
  if (!location) return null
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(location)}`
})

// Navigation sections (dynamic based on enabled features)
const navigationSections = computed(() => {
  const sections = ['hero']

  // Gallery after hero
  if (galleryImages.value.length > 0) {
    sections.push('gallery')
  }

  // Map/Location is second
  if (edition.value?.location?.title) {
    sections.push('map')
  }

  // Tickets is third
  if (isTicketsEnabled.value && activeTickets.value.length > 0) {
    sections.push('tickets')
  }

  if (countdown.value && conventionStatus.value === 'upcoming') {
    sections.push('countdown')
  }

  if (platformFeatures.value.length > 0) {
    sections.push('features')
  }

  if (isLibraryEnabled.value && trendingGames.value.length > 0) {
    sections.push('games')
  }

  return sections
})

// Handle scroll
function handleScroll(): void {
  scrollY.value = window.scrollY

  for (const section of navigationSections.value) {
    const element = document.getElementById(section)
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top <= 200 && rect.bottom >= 200) {
        activeSection.value = section
        break
      }
    }
  }
}

function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)

  if (isLibraryEnabled.value) {
    await loadTrendingGames()
  }

  if (isTicketsEnabled.value) {
    await loadTickets()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

async function loadTrendingGames(): Promise<void> {
  try {
    isLoadingGames.value = true
    const games = await libraryService.get()
    trendingGames.value = getRandomItems(games, 6)
  } catch {
    trendingGames.value = []
  } finally {
    isLoadingGames.value = false
  }
}

async function loadTickets(): Promise<void> {
  try {
    if (tenant.value?.id && edition.value?.id) {
      availableTickets.value = await ticketService.get(
        tenant.value.id,
        edition.value.id,
      )
    }
  } catch {
    availableTickets.value = []
  }
}

function getRandomItems<T>(items: T[], count: number): T[] {
  const itemsToShuffle = [...items]
  const shuffled: T[] = []
  for (let i = 0; i < Math.min(count, itemsToShuffle.length); i++) {
    const randomIndex = Math.floor(Math.random() * itemsToShuffle.length)
    const item = itemsToShuffle[randomIndex]
    if (item !== undefined) {
      shuffled.push(item)
      itemsToShuffle.splice(randomIndex, 1)
    }
  }
  return shuffled
}

// Features for the platform
const platformFeatures = computed(() => {
  const features = []

  if (isLibraryEnabled.value) {
    features.push({
      id: 'library',
      name: t('landing.features.library.name'),
      description: t('landing.features.library.description'),
      icon: IconBooks,
      route: RouteNames.public.library,
      gradient: 'from-violet-600 to-indigo-600',
      available: true,
    })
  }

  if (isTournamentsEnabled.value) {
    features.push({
      id: 'tournaments',
      name: t('landing.features.tournaments.name'),
      description: t('landing.features.tournaments.description'),
      icon: IconTrophy,
      route: RouteNames.public.tournaments,
      gradient: 'from-amber-500 to-orange-600',
      available: true,
    })
  }

  if (isFleaEnabled.value) {
    features.push({
      id: 'flea',
      name: t('landing.features.fleaMarket.name'),
      description: t('landing.features.fleaMarket.description'),
      icon: IconShoppingBag,
      route: RouteNames.public.fleaMarket,
      gradient: 'from-emerald-500 to-teal-600',
      available: true,
    })
  }

  return features
})
</script>

<template>
  <div
    class="relative bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden"
  >
    <!-- Fixed Header with Logo -->
    <LandingHeader
      :tenant-logo="tenant?.logo"
      :tenant-name="tenant?.name"
      :edition-name="edition?.name"
    />

    <!-- Fixed Navigation Dots -->
    <LandingNavDots
      :sections="navigationSections"
      :active-section="activeSection"
      @scroll-to="scrollToSection"
    />

    <!-- Hero Section -->
    <LandingHero
      :edition-name="edition?.name"
      :tenant-name="tenant?.name"
      :description="edition?.description"
      :start-date="edition?.start_date"
      :end-date="edition?.end_date"
      :location-title="edition?.location?.title"
      :convention-status="conventionStatus"
      :countdown="countdown"
      :primary-c-t-a="primaryCTA"
      :scroll-y="scrollY"
      @scroll-to="scrollToSection"
    />

    <!-- Gallery Section - Convention Photos -->
    <LandingGallery
      v-if="galleryImages.length > 0"
      id="gallery"
      :images="galleryImages"
    />

    <!-- Map Section (Second) -->
    <LandingMap
      v-if="edition?.location?.title"
      :location-title="edition.location.title"
      :location-url="edition.location.url"
      :start-date="edition.start_date"
      :end-date="edition.end_date"
      :map-embed-url="mapEmbedUrl"
    />

    <!-- Tickets Section (Third) -->
    <LandingTickets
      v-if="isTicketsEnabled && activeTickets.length > 0"
      :tickets="activeTickets"
      :is-library-enabled="isLibraryEnabled"
      :is-tournaments-enabled="isTournamentsEnabled"
    />

    <!-- Countdown Section -->
    <LandingCountdown
      v-if="countdown && conventionStatus === 'upcoming'"
      :countdown="countdown"
      :start-date="edition?.start_date"
    />

    <!-- Second Gallery Strip (minimal, no title) -->
    <LandingGallery
      v-if="galleryImages.length > 3"
      :images="galleryImages.slice(0, 4)"
      title=""
      subtitle=""
    />

    <!-- Features / Platform Section -->
    <LandingFeatures
      v-if="platformFeatures.length > 0"
      :features="platformFeatures"
    />

    <!-- Games Preview Section -->
    <LandingGames
      v-if="isLibraryEnabled && trendingGames.length > 0"
      :games="trendingGames"
    />

    <!-- Final CTA Section -->
    <LandingCta />

    <!-- Footer -->
    <LandingFooter :tenant-logo="tenant?.logo" :tenant-name="tenant?.name" />
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}
</style>
