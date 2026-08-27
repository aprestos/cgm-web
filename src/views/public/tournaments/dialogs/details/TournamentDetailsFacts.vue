<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'

interface Props {
  tournament: Tournament
}

interface Fact {
  key: string
  label: string
  value: string
  hint?: string
}

const props = defineProps<Props>()

const { t, locale } = useI18n()

// The dialog carries the whole date; the card only had room for the weekday.
const startsAt = computed<string>(() =>
  DateTime.fromISO(props.tournament.startsAt)
    .setLocale(locale.value)
    .toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
)

const startsAtTime = computed<string>(() =>
  DateTime.fromISO(props.tournament.startsAt)
    .setLocale(locale.value)
    .toLocaleString({ hour: '2-digit', minute: '2-digit' }),
)

// Two per row, label above value — a full date and a long venue both fit,
// which is what squeezed them when they shared a line with an icon.
const facts = computed<Fact[]>(() => [
  {
    key: 'date',
    label: t('public.tournaments.date'),
    value: startsAt.value,
    hint: startsAtTime.value,
  },
  ...(props.tournament.place
    ? [
        {
          key: 'place',
          label: t('public.tournaments.place'),
          value: props.tournament.place,
        },
      ]
    : []),
  {
    key: 'format',
    label: t('public.tournaments.details.format'),
    value: t(`public.tournaments.format.${props.tournament.format}`),
    hint: t('public.tournaments.details.maxParticipants', {
      count: props.tournament.maxParticipants,
    }),
  },
  ...(props.tournament.organizer
    ? [
        {
          key: 'organizer',
          label: t('public.tournaments.organizer'),
          value: props.tournament.organizer,
        },
      ]
    : []),
])
</script>

<template>
  <dl class="grid grid-cols-2 gap-x-6 gap-y-5">
    <div v-for="fact in facts" :key="fact.key" class="min-w-0">
      <dt
        class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        {{ fact.label }}
      </dt>
      <dd class="mt-1.5 text-sm leading-snug text-gray-900 dark:text-white">
        {{ fact.value }}
        <span v-if="fact.hint" class="block text-gray-500 dark:text-gray-400">
          {{ fact.hint }}
        </span>
      </dd>
    </div>
  </dl>
</template>
