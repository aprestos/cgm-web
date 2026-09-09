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
import logger from '@/lib/logger.ts'
import { formatDateRange } from '@/utils/date'
import { useSeo } from '@/composables/useSeo'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()
const settingsStore = useSettingsStore()

const { t, locale } = useI18n()

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
/**
 * The page's content, fetched while the page is being rendered.
 *
 * This used to be three `onMounted` calls, which meant a crawler — and the
 * first paint — got the empty state. Step 5b of `docs/ssr-migration.md`.
 *
 * One `useAsyncData` for all three rather than three of them, because the
 * server awaits each in turn and three awaited fetches are the waterfall this
 * migration exists to remove. `Promise.allSettled` makes it one round trip's
 * worth of latency, and keeps the old behaviour where a section that fails to
 * load leaves the rest of the page standing: `ticketService.getAll` and
 * `tournamentService.getAll` both throw on error, and a throw during render is
 * a 500 for the whole page rather than a missing section.
 *
 * Awaited, because an un-awaited `useAsyncData` resolves after the render it
 * was supposed to fill: the server would serialise the empty state, which is
 * the bug this step exists to fix.
 */
const { data: content } = await useAsyncData(
  'landing-content',
  async () => {
    const tenantId = tenant.value?.id
    const editionId = edition.value?.id
    if (!tenantId || !editionId) return emptyContent()

    const [games, tickets, tournaments] = await Promise.allSettled([
      isLibraryEnabled.value
        ? libraryService.get(tenantId, editionId)
        : Promise.resolve<LibraryGame[]>([]),
      isTicketsEnabled.value
        ? ticketService.getAll(tenantId, editionId, TicketStatus.ACTIVE)
        : Promise.resolve<Ticket[]>([]),
      isTournamentsEnabled.value
        ? tournamentService.getAll(tenantId, editionId)
        : Promise.resolve<Tournament[]>([]),
    ])

    return {
      // Shuffled here rather than in a computed so that the server and the
      // browser agree on the result: it happens once, during the render, and
      // the chosen thirteen ride to the client in the payload. Shuffling again
      // on the client would mismatch every card in the mosaic.
      trendingGames: getRandomItems(
        settled(games, 'trending games'),
        TRENDING_GAMES_COUNT,
      ),
      tickets: settled(tickets, 'tickets'),
      tournaments: settled(tournaments, 'tournaments'),
    }
  },
  { default: emptyContent },
)

const trendingGames = computed(() => content.value?.trendingGames ?? [])
const availableTickets = computed(() => content.value?.tickets ?? [])
const tournaments = computed(() => content.value?.tournaments ?? [])

const hasTournaments = computed(
  () => isTournamentsEnabled.value && tournaments.value.length > 0,
)

/**
 * What a crawler and a link preview see for this page.
 *
 * No title: the landing page is the site, and `useSeo` already titles it with
 * the edition's name. The description prefers whatever the tenant wrote about
 * this edition over anything we can assemble for them.
 */
useSeo({
  description: () => {
    const name = edition.value?.name ?? tenant.value?.name ?? ''
    const start = edition.value?.start_date
    const end = edition.value?.end_date

    return (
      edition.value?.description ??
      tenant.value?.shortDescription ??
      (start && end
        ? t('landing.seo.withDates', {
            name,
            dates: formatDateRange(start, end, locale.value),
          })
        : t('landing.seo.description', { name }))
    )
  },
})

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

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

/** The shape `content` has before anything has been fetched, and if a render
 * finds no tenant or no current edition to fetch for. */
function emptyContent(): {
  trendingGames: LibraryGame[]
  tickets: Ticket[]
  tournaments: Tournament[]
} {
  return { trendingGames: [], tickets: [], tournaments: [] }
}

/**
 * The value of a settled fetch, or an empty list if it rejected.
 *
 * The rejection is logged rather than swallowed: this runs on a server now,
 * where nobody is watching a console, and a section quietly missing from a
 * page that renders fine otherwise is exactly the failure that goes unnoticed.
 */
function settled<T>(result: PromiseSettledResult<T[]>, what: string): T[] {
  if (result.status === 'fulfilled') return result.value
  logger.error(`Unable to load ${what} for the landing page`, {
    error: result.reason,
  })
  return []
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
