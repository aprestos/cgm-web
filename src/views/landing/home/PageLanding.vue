<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { editionStore } from '@/stores/edition.js'
import { settingsStore } from '@/features/settings/useSettings.store.js'
import { IconBooks, IconUsers, IconTicket } from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames.js'
import { tenantStore } from '@/stores/tenant.js'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { libraryService } from '@/features/library/games/service.ts'
import type { Ticket } from '@/features/tickets/ticket.model.ts'
import { ticketService } from '@/features/tickets/service.ts'

// Components
import HeroView from './HeroView.vue'
import GalleryView from './GalleryView.vue'
import TicketsView from './TicketsView.vue'
import CountdownView from './CountdownView.vue'
import LibraryView from './LibraryView.vue'
import CtaView from './CtaView.vue'
import FooterView from './FooterView.vue'
import MapView from '@/views/landing/home/MapView.vue'

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

const earliestSaleFrom = computed(() => {
  let earliest: string | null = null

  for (const ticket of availableTickets.value) {
    if (!ticket.active || !ticket.saleFrom) continue

    const ticketSaleFrom = new Date(ticket.saleFrom)
    if (Number.isNaN(ticketSaleFrom.getTime())) continue

    if (!earliest || ticketSaleFrom < new Date(earliest)) {
      earliest = ticket.saleFrom
    }
  }

  return earliest
})

const isBeforeEarliestSaleFrom = computed(() => {
  if (!earliestSaleFrom.value) return false
  return new Date() < new Date(earliestSaleFrom.value)
})

const shouldShowTicketsSection = computed(
  () => activeTickets.value.length > 0 || isBeforeEarliestSaleFrom.value,
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

// Navigation sections (dynamic based on enabled features)
const navigationSections = computed(() => {
  const sections = []

  if (isTicketsEnabled.value && shouldShowTicketsSection.value) {
    sections.push('tickets')
  }

  if (isLibraryEnabled.value) {
    sections.push('library')
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
    trendingGames.value = getRandomItems(games, 10)
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
</script>

<template>
  <div
    class="relative bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden"
  >
    <!-- Hero Section -->
    <HeroView
      class="min-h-screen"
      :convention-status="conventionStatus"
      :countdown="countdown"
      :primary-cta="primaryCTA"
      :scroll-y="scrollY"
      :poster-url="edition?.poster_url"
      @scroll-to="scrollToSection"
    />

    <!-- Gallery Section - Convention Photos -->
    <GalleryView
      v-if="galleryImages.length > 0"
      id="gallery"
      class="min-h-screen"
      :images="galleryImages"
    />

    <!-- Tickets Section (Third) -->
    <TicketsView
      v-if="isTicketsEnabled && shouldShowTicketsSection"
      class="min-h-screen"
      :tickets="activeTickets"
      :show-coming-soon="isBeforeEarliestSaleFrom"
      :earliest-sale-from="earliestSaleFrom"
      :is-library-enabled="isLibraryEnabled"
      :is-tournaments-enabled="isTournamentsEnabled"
    />

    <MapView
      class="min-h-screen"
      :location-title="editionStore?.location?.title as string"
      :map-embed-url="editionStore?.location?.url as string"
    />

    <!-- Countdown Section -->
    <CountdownView
      v-if="countdown && conventionStatus === 'upcoming'"
      class="min-h-screen"
      :countdown="countdown"
      :start-date="edition?.start_date"
    />

    <!-- Games Preview Section -->
    <LibraryView
      v-if="isLibraryEnabled && trendingGames.length > 0"
      class="min-h-screen"
      section-id="library"
      :games="trendingGames"
    />

    <!-- Final CTA Section -->
    <CtaView class="min-h-screen" />

    <!-- Footer -->
    <FooterView :tenant-logo="tenant?.logo" :tenant-name="tenant?.name" />
  </div>
</template>
