<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditionStore } from '@/features/events/edition.store'
import { useSettingsStore } from '@/features/settings/useSettings.store'
import { IconBooks, IconTicket, IconUsers } from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames.js'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { libraryService } from '@/features/library/games/service.ts'
import { type Ticket, TicketStatus } from '@/features/tickets/ticket.model.ts'
import { ticketService } from '@/features/tickets/service.ts'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'

// Components
import HeroView from './HeroView.vue'
import GalleryView from './GalleryView.vue'
import TicketsView from './TicketsView.vue'
import LibraryView from './LibraryView.vue'
import CtaView from './CtaView.vue'
import FooterView from './FooterView.vue'
import MapView from '@/views/landing/home/MapView.vue'
import ScheduleView from './ScheduleView.vue'
import TournamentsView from './TournamentsView.vue'
import type { Schedule } from '@/features/events/edition.model.ts'
import tournamentService from '@/features/tournaments/events/service.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()
const settingsStore = useSettingsStore()

const { t } = useI18n()

// Stores
const edition = computed(() => editionStore.edition)
const tenant = computed(() => tenantStore.tenant)
const settings = computed(() => settingsStore.settings)

// Convention gallery images (tenant images take priority, fallback to defaults)
const galleryImages = computed(() => {
  const tenantImages = tenant.value?.images ?? []
  if (tenantImages.length > 0) {
    return tenantImages
  }
  return []
})
const scheduleImages = computed<Schedule>(() => edition.value?.schedule ?? {})

// The mosaic in LibraryView is built to tile flush with exactly this many
// cards, so keep it in sync with the pattern in getGameCardClass().
const TRENDING_GAMES_COUNT = 13

// Data
const trendingGames = ref<LibraryGame[]>([])
const availableTickets = ref<Ticket[]>([])
const tournaments = ref<Tournament[]>([])
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
const hasTournaments = computed(
  () => isTournamentsEnabled.value && tournaments.value.length > 0,
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

  if (isTicketsEnabled.value && availableTickets.value.length > 0) {
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

  if (
    (scheduleImages.value.desktop?.length ?? 0) > 0 ||
    (scheduleImages.value.smartphone?.length ?? 0) > 0
  ) {
    sections.push('schedule')
  }

  if (isTicketsEnabled.value) {
    sections.push('tickets')
  }

  if (isLibraryEnabled.value) {
    sections.push('library')
  }

  if (hasTournaments.value) {
    sections.push('tournaments')
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

  if (isTournamentsEnabled.value) {
    await loadTournaments()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

async function loadTrendingGames(): Promise<void> {
  try {
    isLoadingGames.value = true
    const games = await libraryService.get()
    trendingGames.value = getRandomItems(games, TRENDING_GAMES_COUNT)
  } catch {
    trendingGames.value = []
  } finally {
    isLoadingGames.value = false
  }
}

async function loadTickets(): Promise<void> {
  try {
    if (tenant.value?.id && edition.value?.id) {
      availableTickets.value = await ticketService.getAll(
        tenant.value.id,
        edition.value.id,
        TicketStatus.ACTIVE,
      )
    }
  } catch {
    availableTickets.value = []
  }
}

async function loadTournaments(): Promise<void> {
  try {
    if (tenant.value?.id && edition.value?.id) {
      tournaments.value = await tournamentService.getAll(
        tenant.value.id,
        edition.value.id,
      )
    }
  } catch {
    tournaments.value = []
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
  <!-- Background lives on BaseLandingPage so every section can stay transparent -->
  <div class="relative overflow-x-hidden">
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

    <MapView />

    <ScheduleView
      v-if="
        (scheduleImages.desktop?.length ?? 0) > 0 ||
        (scheduleImages.smartphone?.length ?? 0) > 0
      "
      :images="scheduleImages"
    />

    <!-- Tickets Section (Third) -->
    <TicketsView
      v-if="isTicketsEnabled"
      :tickets="availableTickets"
      :is-library-enabled="isLibraryEnabled"
      :is-tournaments-enabled="isTournamentsEnabled"
    />

    <!-- Games Preview Section -->
    <LibraryView
      v-if="isLibraryEnabled && trendingGames.length > 0"
      class="min-h-screen"
      section-id="library"
      :games="trendingGames"
    />

    <!-- Tournaments Section -->
    <TournamentsView v-if="hasTournaments" :tournaments="tournaments" />

    <!-- Gallery Section - Convention Photos -->
    <GalleryView
      v-if="galleryImages.length > 0"
      id="gallery"
      :images="galleryImages"
    />

    <!-- Final CTA Section -->
    <CtaView />

    <!-- Footer -->
    <FooterView />
  </div>
</template>
