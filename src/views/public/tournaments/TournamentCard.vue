<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import {
  IconCalendar,
  IconMapPin,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import { type Tournament, TournamentStatus } from '@/features/tournaments/model'

interface Props {
  tournament: Tournament
  canJoin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canJoin: false,
})

const emit = defineEmits<{
  join: [tournament: Tournament]
}>()

const { t, locale } = useI18n()

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled: 'bg-white/90 text-gray-900 dark:bg-gray-900/90 dark:text-white',
  ongoing: 'bg-green-500 text-white',
  finished: 'bg-gray-900/80 text-white dark:bg-white/15',
  cancelled: 'bg-red-500 text-white',
}

// Cover and thumbnail are both optional, so cards fall back to a placeholder.
const image = computed<string | null>(
  () => props.tournament.cover || props.tournament.thumbnail || null,
)

const slotsLeft = computed<number>(() =>
  Math.max(props.tournament.maxParticipants - props.tournament.participants, 0),
)

const isFull = computed<boolean>(() => slotsLeft.value === 0)

const fillPercentage = computed<number>(() => {
  if (!props.tournament.maxParticipants) return 0
  return Math.min(
    Math.round(
      (props.tournament.participants / props.tournament.maxParticipants) * 100,
    ),
    100,
  )
})

// Only tournaments that haven't started yet are open for sign-ups.
const isOpen = computed<boolean>(
  () => props.tournament.status === TournamentStatus.scheduled && !isFull.value,
)

const startsAt = computed<string>(() =>
  DateTime.fromISO(props.tournament.startsAt)
    .setLocale(locale.value)
    .toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
)
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-900 dark:ring-white/10 dark:hover:ring-white/20"
  >
    <!-- Cover -->
    <div
      class="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-white/5"
    >
      <img
        v-if="image"
        :src="image"
        :alt="tournament.title"
        loading="lazy"
        decoding="async"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="flex size-full items-center justify-center bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30"
      >
        <IconTrophy class="size-14 text-amber-400/80 dark:text-white/20" />
      </div>

      <!-- Status -->
      <span
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur"
        :class="STATUS_BADGE[tournament.status]"
      >
        <span
          v-if="tournament.status === TournamentStatus.ongoing"
          class="size-1.5 animate-pulse rounded-full bg-current"
        />
        {{ t(`public.tournaments.status.${tournament.status}`) }}
      </span>

      <!-- Remaining slots -->
      <span
        v-if="isOpen"
        class="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      >
        {{ t('public.tournaments.slotsLeft', { count: slotsLeft }) }}
      </span>
      <span
        v-else-if="isFull && tournament.status === TournamentStatus.scheduled"
        class="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      >
        {{ t('public.tournaments.full') }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h3
          class="font-display font-semibold text-gray-900 dark:text-white line-clamp-2"
        >
          {{ tournament.title }}
        </h3>
        <p
          v-if="tournament.organizer"
          class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400"
        >
          {{
            t('public.tournaments.organizedBy', { name: tournament.organizer })
          }}
        </p>
      </div>

      <dl class="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-center gap-2">
          <dt class="sr-only">{{ t('public.tournaments.date') }}</dt>
          <IconCalendar class="size-4 shrink-0 text-gray-400" />
          <dd class="truncate">{{ startsAt }}</dd>
        </div>
        <div v-if="tournament.place" class="flex items-center gap-2">
          <dt class="sr-only">{{ t('public.tournaments.place') }}</dt>
          <IconMapPin class="size-4 shrink-0 text-gray-400" />
          <dd class="truncate">{{ tournament.place }}</dd>
        </div>
      </dl>

      <!-- Occupancy -->
      <div class="mt-auto pt-1">
        <div
          class="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          <span class="inline-flex items-center gap-1.5">
            <IconUsers class="size-4" />
            {{ tournament.participants }} / {{ tournament.maxParticipants }}
          </span>
          <span>{{ t(`public.tournaments.format.${tournament.format}`) }}</span>
        </div>
        <div
          class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="isFull ? 'bg-gray-400 dark:bg-white/30' : 'bg-amber-500'"
            :style="{ width: `${fillPercentage}%` }"
          />
        </div>
      </div>

      <CButton
        v-if="canJoin"
        full-width
        variant="tertiary"
        :disabled="!isOpen"
        @click="emit('join', tournament)"
      >
        <template #icon-left>
          <IconTrophy class="size-4" />
        </template>
        {{
          isOpen
            ? t('public.tournaments.join')
            : isFull
              ? t('public.tournaments.full')
              : t('public.tournaments.closed')
        }}
      </CButton>
    </div>
  </article>
</template>

<style scoped></style>
