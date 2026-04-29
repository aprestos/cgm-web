<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { editionStore } from '@/stores/edition.ts'
import { settingsStore } from '@/features/settings/useSettings.store.ts'
import { IconBooks, IconUsers, IconTicket } from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { libraryService } from '@/features/library/games/service.ts'
import type { Ticket } from '@/features/tickets/ticket.model.ts'
import { ticketService } from '@/features/tickets/service.ts'

// Components
import LandingHeader from './landing/LandingHeader.vue'
import LandingHero from './landing/LandingHero.vue'
import LandingGallery from './landing/LandingGallery.vue'
import LandingTickets from './landing/LandingTickets.vue'
import LandingCountdown from './landing/LandingCountdown.vue'
import LandingGames from './landing/LandingGames.vue'
import LandingMap from './landing/LandingMap.vue'
import LandingCta from './landing/LandingCta.vue'
import LandingFooter from './landing/LandingFooter.vue'
import LandingCartDrawer from '@/views/public/landing/LandingCartDrawer.vue'
import logger from '@/lib/logger.ts'

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

const activeTickets = computed(() =>
  availableTickets.value.filter((ticket) => {
    if (!ticket.active) return false
    const now = new Date()
    if (ticket.saleFrom && new Date(ticket.saleFrom) > now) return false
    return !(ticket.saleUntil && new Date(ticket.saleUntil) < now)
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
        text: t('landing.hero.enterLibrary'),
        route: RouteNames.public.library,
        icon: IconBooks,
        style: 'live',
      }
    }
  }

  if (isTicketsEnabled.value && activeTickets.value.length > 0) {
    return {
      text: t('landing.hero.getTickets'),
      href: '#tickets',
      icon: IconTicket,
      style: 'tickets',
    }
  }

  if (isLibraryEnabled.value) {
    return {
      text: t('landing.hero.exploreLibrary'),
      route: RouteNames.public.library,
      icon: IconBooks,
      style: 'default',
    }
  }

  return {
    text: t('landing.hero.joinCommunity'),
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
  const sections = []

  if (isTicketsEnabled.value && activeTickets.value.length > 0) {
    sections.push('tickets')
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

const isCartDrawerOpen = ref<boolean>(false)

function openCartDrawer(): void {
  logger.info('Opening cart drawer')
  isCartDrawerOpen.value = true
}
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
      :sections="navigationSections"
      :active-section="activeSection"
      @navigate="scrollToSection"
      @cart-click="openCartDrawer"
    />

    <!-- Hero Section -->
    <LandingHero
      :convention-status="conventionStatus"
      :countdown="countdown"
      :primary-cta="primaryCTA"
      :scroll-y="scrollY"
      :poster-url="edition?.poster_url"
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

    <!-- Games Preview Section -->
    <LandingGames
      v-if="isLibraryEnabled && trendingGames.length > 0"
      :games="trendingGames"
    />

    <!-- Final CTA Section -->
    <LandingCta />

    <!-- Footer -->
    <LandingFooter :tenant-logo="tenant?.logo" :tenant-name="tenant?.name" />

    <LandingCartDrawer v-model:open="isCartDrawerOpen" />
  </div>
</template>
