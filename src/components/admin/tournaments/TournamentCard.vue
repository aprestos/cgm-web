<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { IconCalendar, IconMapPin, IconTrophy } from '@tabler/icons-vue'
import BaseCard from '@/components/BaseCard.vue'
import TournamentActions from './TournamentActions.vue'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'

const props = defineProps<{ tournament: Tournament }>()

const emit = defineEmits<{
  edit: [tournament: Tournament]
  participants: [tournament: Tournament]
}>()

const { t, locale } = useI18n()

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-400/20',
  ongoing:
    'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-400/20',
  finished:
    'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10',
  cancelled:
    'bg-red-100 text-red-600 ring-red-500/20 dark:bg-white/5 dark:text-red-400 dark:ring-white/10',
}

// Above this share of the slots taken the meter warns that spots run out.
const NEARLY_FULL_PERCENTAGE = 80

const startsAt = computed<string>(() =>
  DateTime.fromISO(props.tournament.startsAt)
    .setLocale(locale.value)
    .toLocaleString({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
)

const fillPercentage = computed<number>(() => {
  if (!props.tournament.maxParticipants) return 0
  return Math.min(
    Math.round(
      (props.tournament.participants / props.tournament.maxParticipants) * 100,
    ),
    100,
  )
})

const isFull = computed<boolean>(
  () => props.tournament.participants >= props.tournament.maxParticipants,
)

// Neutral while there is room, amber close to the limit, grey once it is full.
const fillClasses = computed<string>(() => {
  if (isFull.value) return 'bg-gray-400 dark:bg-white/30'
  if (fillPercentage.value >= NEARLY_FULL_PERCENTAGE)
    return 'bg-amber-500 dark:bg-amber-400'
  return 'bg-primary-500 dark:bg-primary-400'
})
</script>

<template>
  <BaseCard>
    <div class="flex h-full flex-col gap-4">
      <!-- Identity + status + actions -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20"
          >
            <IconTrophy class="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="min-w-0">
            <h3
              class="truncate font-display font-semibold text-gray-900 dark:text-white"
              :title="tournament.title"
            >
              {{ tournament.title }}
            </h3>
            <p
              v-if="tournament.organizer"
              class="truncate text-sm text-gray-500 dark:text-gray-400"
            >
              {{ tournament.organizer }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
            :class="STATUS_BADGE[tournament.status]"
          >
            <span
              v-if="tournament.status === TournamentStatus.ongoing"
              class="size-1.5 animate-pulse rounded-full bg-current"
            />
            {{ t(`admin.tournaments.status.${tournament.status}`) }}
          </span>

          <TournamentActions
            :tournament="tournament"
            @edit="emit('edit', $event)"
            @participants="emit('participants', $event)"
          />
        </div>
      </div>

      <!-- Facts -->
      <dl class="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-center gap-2">
          <dt class="sr-only">{{ t('admin.tournaments.form.startsAt') }}</dt>
          <IconCalendar class="size-4 shrink-0 text-gray-400" />
          <dd class="truncate">{{ startsAt }}</dd>
        </div>
        <div v-if="tournament.place" class="flex items-center gap-2">
          <dt class="sr-only">{{ t('admin.tournaments.form.place') }}</dt>
          <IconMapPin class="size-4 shrink-0 text-gray-400" />
          <dd class="truncate">{{ tournament.place }}</dd>
        </div>
      </dl>

      <!-- Occupancy — pinned to the bottom so cards line up in the grid -->
      <div class="mt-auto pt-1">
        <div
          class="flex items-center justify-between gap-2 text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          <span class="shrink-0">
            {{ tournament.participants }} / {{ tournament.maxParticipants }}
            {{ t('admin.tournaments.participants') }}
          </span>
          <span class="truncate">
            {{ t(`admin.tournaments.format.${tournament.format}`) }}
          </span>
        </div>
        <div
          class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="fillClasses"
            :style="{ width: `${fillPercentage}%` }"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped></style>
