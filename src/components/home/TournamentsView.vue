<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconArrowRight, IconTrophy } from '@tabler/icons-vue'
import { DateTime } from 'luxon'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/routeNames'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'

const { t } = useI18n()

interface Props {
  tournaments: Tournament[]
}

const props = defineProps<Props>()

// This is a teaser, not a listing: only a handful of tournaments are shown.
const MAX_TOURNAMENTS = 3

// Ongoing first, then the next ones to start, finished ones last.
const STATUS_ORDER: Record<TournamentStatus, number> = {
  [TournamentStatus.ongoing]: 0,
  [TournamentStatus.scheduled]: 1,
  [TournamentStatus.finished]: 2,
  [TournamentStatus.cancelled]: 3,
}

const visibleTournaments = computed<Tournament[]>(() =>
  [...props.tournaments]
    .filter((tournament) => tournament.status !== TournamentStatus.cancelled)
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        DateTime.fromISO(a.startsAt).toMillis() -
          DateTime.fromISO(b.startsAt).toMillis(),
    )
    .slice(0, MAX_TOURNAMENTS),
)

// Keep small line-ups centered instead of hanging on the left of a 3-col grid.
const gridClass = computed<string>(() => {
  const count = visibleTournaments.value.length
  if (count === 1) return 'max-w-sm grid-cols-1'
  if (count === 2) return 'max-w-2xl grid-cols-2'
  return 'max-w-5xl grid-cols-1 sm:grid-cols-3'
})

// Cover and thumbnail are optional today, so every card falls back gracefully.
function getImage(tournament: Tournament): string | null {
  return tournament.thumbnail || tournament.cover || null
}
</script>

<template>
  <section id="tournaments" class="relative overflow-hidden py-32">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.1),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.14),transparent_55%)]"
    />

    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <!-- Section Header -->
      <div class="text-center">
        <h2
          class="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400"
        >
          {{ t('landing.tournaments.sectionTitle') }}
        </h2>
        <p
          class="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
        >
          {{ t('landing.tournaments.sectionSubtitle') }}
        </p>
      </div>

      <!-- Tournaments Grid -->
      <div class="mx-auto mt-12 grid gap-4 sm:gap-5" :class="gridClass">
        <article
          v-for="tournament in visibleTournaments"
          :key="tournament.id"
          class="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl hover:ring-amber-300 dark:bg-gray-900 dark:shadow-none dark:ring-white/10 dark:hover:ring-white/20 sm:aspect-[3/4]"
        >
          <!-- Cover / thumbnail -->
          <img
            v-if="getImage(tournament)"
            :src="getImage(tournament) ?? ''"
            :alt="tournament.title"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30"
          >
            <IconTrophy class="h-16 w-16 text-amber-300 dark:text-white/20" />
          </div>

          <!-- Overlay -->
          <div
            class="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/40 to-transparent"
          />

          <!-- Content -->
          <div class="absolute inset-x-0 bottom-0 p-4">
            <h3 class="text-lg font-semibold text-white">
              {{ tournament.title }}
            </h3>
            <p v-if="tournament.organizer" class="mt-1 text-sm text-white/60">
              {{
                t('landing.tournaments.organizedBy', {
                  name: tournament.organizer,
                })
              }}
            </p>
          </div>
        </article>
      </div>

      <!-- View all -->
      <div class="mt-10 text-center">
        <RouterLink
          :to="{ name: RouteNames.public.tournaments }"
          class="inline-flex items-center gap-2 rounded-full bg-gray-900/10 px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-900/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          {{ t('landing.tournaments.viewAll') }}
          <IconArrowRight class="h-4 w-4" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
