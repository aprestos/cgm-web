<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconGift, IconMedal, IconTrophy, IconUsers } from '@tabler/icons-vue'
import {
  type CreateTournament,
  TournamentPrizeType,
} from '../tournament.model.ts'
import { resolveLocalized } from '@/utils/localizedString.ts'

interface Props {
  /** Widened past `Tournament` so a draft can be previewed before it exists. */
  tournament: CreateTournament
  /** Drops the heading and the divider for a caller that frames it itself. */
  bare?: boolean
}

interface Prize {
  type: TournamentPrizeType
  label: string
  value: string
}

const props = withDefaults(defineProps<Props>(), { bare: false })

const { t, locale } = useI18n()

// Declaration order doubles as display order: podium first, then the catch-alls.
const PODIUM_PRIZE_TYPES = [
  TournamentPrizeType.first,
  TournamentPrizeType.second,
  TournamentPrizeType.third,
] as const

const OTHER_PRIZE_TYPES = [
  TournamentPrizeType.all,
  TournamentPrizeType.others,
] as const

const PRIZE_ICON = {
  [TournamentPrizeType.first]: IconTrophy,
  [TournamentPrizeType.second]: IconMedal,
  [TournamentPrizeType.third]: IconMedal,
  [TournamentPrizeType.all]: IconUsers,
  [TournamentPrizeType.others]: IconGift,
}

const PRIZE_ICON_COLOR = {
  [TournamentPrizeType.first]: 'text-amber-500',
  [TournamentPrizeType.second]: 'text-gray-400',
  [TournamentPrizeType.third]: 'text-orange-700 dark:text-orange-500',
  [TournamentPrizeType.all]: 'text-primary-500',
  [TournamentPrizeType.others]: 'text-primary-500',
}

// First place is the one prize that carries its own colour — everything else
// stays on the neutral surface so the podium still reads top to bottom.
const PRIZE_SURFACE = {
  [TournamentPrizeType.first]:
    'bg-amber-50 ring-amber-200/70 dark:bg-amber-400/10 dark:ring-amber-400/25',
  [TournamentPrizeType.second]:
    'bg-gray-50 ring-gray-200 dark:bg-white/5 dark:ring-white/10',
  [TournamentPrizeType.third]:
    'bg-gray-50 ring-gray-200 dark:bg-white/5 dark:ring-white/10',
  [TournamentPrizeType.all]:
    'bg-gray-50 ring-gray-200 dark:bg-white/5 dark:ring-white/10',
  [TournamentPrizeType.others]:
    'bg-gray-50 ring-gray-200 dark:bg-white/5 dark:ring-white/10',
}

const prizeFor = (type: TournamentPrizeType): Prize | null => {
  const value = resolveLocalized(props.tournament.prizes?.[type], locale.value)
  if (!value) return null

  return { type, label: t(`public.tournaments.prize.${type}`), value }
}

// Prizes are optional per type, and each is stored in whichever language the
// organizer typed it in — empty ones simply drop out of the list. The podium
// sits in a row of cards, the catch-alls span the width below it.
const podiumPrizes = computed<Prize[]>(() =>
  PODIUM_PRIZE_TYPES.map(prizeFor).filter(
    (prize): prize is Prize => prize !== null,
  ),
)

const otherPrizes = computed<Prize[]>(() =>
  OTHER_PRIZE_TYPES.map(prizeFor).filter(
    (prize): prize is Prize => prize !== null,
  ),
)

const hasPrizes = computed<boolean>(
  () => podiumPrizes.value.length > 0 || otherPrizes.value.length > 0,
)
</script>

<template>
  <section
    v-if="hasPrizes"
    :class="bare ? '' : 'border-t border-gray-100 pt-5 dark:border-white/10'"
  >
    <h4
      v-if="!bare"
      class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    >
      {{ t('public.tournaments.details.prizes') }}
    </h4>

    <dl class="grid grid-cols-3 gap-2.5" :class="bare ? '' : 'mt-3'">
      <div
        v-for="prize in podiumPrizes"
        :key="prize.type"
        class="min-w-0 rounded-xl px-3.5 py-3 ring-1"
        :class="PRIZE_SURFACE[prize.type]"
      >
        <dt
          class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          <component
            :is="PRIZE_ICON[prize.type]"
            class="size-4 shrink-0"
            :class="PRIZE_ICON_COLOR[prize.type]"
          />
          {{ prize.label }}
        </dt>
        <dd
          class="mt-1 break-words font-display text-sm font-semibold text-gray-900 dark:text-white"
        >
          {{ prize.value }}
        </dd>
      </div>

      <div
        v-for="prize in otherPrizes"
        :key="prize.type"
        class="flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1 col-span-3"
        :class="PRIZE_SURFACE[prize.type]"
      >
        <component
          :is="PRIZE_ICON[prize.type]"
          class="mt-0.5 size-5 shrink-0"
          :class="PRIZE_ICON_COLOR[prize.type]"
        />
        <div class="min-w-0">
          <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ prize.label }}
          </dt>
          <dd class="text-sm text-gray-900 dark:text-white">
            {{ prize.value }}
          </dd>
        </div>
      </div>
    </dl>
  </section>
</template>
