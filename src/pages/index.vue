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
import HeroView from '@/views/landing/home/HeroView.vue'
import GalleryView from '@/views/landing/home/GalleryView.vue'
import TicketsView from '@/views/landing/home/TicketsView.vue'
import LibraryView from '@/views/landing/home/LibraryView.vue'
import CtaView from '@/views/landing/home/CtaView.vue'
import FooterView from '@/views/landing/home/FooterView.vue'
import MapView from '@/views/landing/home/MapView.vue'
import ScheduleView from '@/views/landing/home/ScheduleView.vue'
import TournamentsView from '@/views/landing/home/TournamentsView.vue'
import type { Schedule } from '@/features/events/edition.model.ts'
import tournamentService from '@/features/tournaments/events/service.ts'
import logger from '@/lib/logger.ts'
import { formatDateRange } from '@/utils/date'
import { useSeo } from '@/composables/useSeo'
import { useJsonLd } from '@/composables/useJsonLd'

definePageMeta({
  layout: 'landing',
  name: RouteNames.landing.home,
})

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
 * Between them the title and the description carry everything the tenant has
 * said about this edition — its name, when it runs, where, and whatever it
 * wrote about itself — in the order a result page makes use of them. Every
 * part is assembled from what actually exists, so a tenant that has filled in
 * less gets a shorter sentence rather than a placeholder standing where a fact
 * should be.
 */
const seoDates = computed(() => {
  const start = edition.value?.start_date
  const end = edition.value?.end_date

  return start && end ? formatDateRange(start, end, locale.value) : undefined
})

const seoPlace = computed(() => edition.value?.location?.title || undefined)

/**
 * When and where, as one sentence, from whichever of the two we have.
 *
 * The year is deliberately not forced in: `formatDateRange` drops it inside a
 * single year, the edition's name usually carries it, and the `Event` JSON-LD
 * below states the real dates to anything that parses rather than reads.
 */
const seoFacts = computed(() => {
  const dates = seoDates.value
  const location = seoPlace.value

  if (dates && location)
    return t('landing.seo.whenAndWhere', { location, dates })
  if (dates) return t('landing.seo.when', { dates })
  if (location) return t('landing.seo.where', { location })

  return undefined
})

useSeo({
  // No `title`: the landing page is the site, so `useSeo` titles it with the
  // edition's name and this follows it. The dates are what tell somebody
  // scanning a list of results whether this is the year they came for, and the
  // venue says which town it is in — either is worth more there than naming
  // the category the app is in. `hero.defaultTitle` is the last resort now,
  // for an edition with neither a date nor a place.
  tagline: () =>
    seoDates.value ?? seoPlace.value ?? t('landing.hero.defaultTitle'),
  description: () => {
    // The tenant's own line leads: it is the only part of this written for a
    // reader rather than assembled for one.
    const lead = edition.value?.description ?? tenant.value?.shortDescription

    // Nothing stands in for the two of these that are missing. An edition with
    // no description, no date and no venue gets no description tag at all,
    // which leaves the result page to quote the page itself — better than a
    // sentence true of every tenant here.
    return [lead, seoFacts.value].filter(Boolean).join(' ') || undefined
  },
})

/**
 * The edition, described for a search engine.
 *
 * An `Event` is one of the few things a result page will render specially —
 * the dates, the venue and the ticket prices can appear in the result itself.
 * All of it is already in the stores by the time this renders.
 *
 * Nothing is emitted without a start date: a convention with no date is not an
 * event a search engine can do anything useful with, and a card with holes in
 * it is worse than no card.
 */
const origin = useRequestURL({ xForwardedHost: true }).origin

useJsonLd(() => {
  const current = edition.value
  if (!current?.start_date) return null

  const place = current.location?.title
  const offers = availableTickets.value.map((ticket) => ({
    '@type': 'Offer',
    name: ticket.name,
    // Prices are stored in minor units — see `formatPrice`.
    price: (ticket.price / 100).toFixed(2),
    priceCurrency: editionStore.currency,
    url: `${origin}/checkout`,
    availability: 'https://schema.org/InStock',
  }))

  return {
    '@type': 'Event',
    name: current.name,
    url: `${origin}/`,
    startDate: current.start_date,
    ...(current.end_date ? { endDate: current.end_date } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(current.description ? { description: current.description } : {}),
    ...(current.poster_url ? { image: [current.poster_url] } : {}),
    // A `Place` with a name and a map link, because a name is all the edition
    // stores — there is no structured address to give.
    ...(place
      ? {
          location: {
            '@type': 'Place',
            name: place,
            ...(current.location?.url ? { url: current.location.url } : {}),
          },
        }
      : {}),
    ...(tenant.value?.name
      ? {
          organizer: {
            '@type': 'Organization',
            name: tenant.value.name,
            url: origin,
          },
        }
      : {}),
    ...(offers.length > 0 ? { offers } : {}),
  }
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
