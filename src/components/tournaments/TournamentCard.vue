<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import {
  IconCalendar,
  IconMapPin,
  IconPencil,
  IconTicket,
  IconTrophy,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CAvatar from '@/components/CAvatar.vue'
import {
  type Tournament,
  TournamentStatus,
} from '@/features/tournaments/tournament.model.ts'
import {
  participantDisplayName,
  participantInitials,
  type TournamentParticipant,
} from '@/features/tournaments/participant.model.ts'
import { slotsLeft as remainingSlots } from './tournaments.filters.ts'

interface Props {
  tournament: Tournament
  participants: TournamentParticipant[]
  canJoin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canJoin: false,
})

const emit = defineEmits<{
  details: [tournament: Tournament]
  join: [tournament: Tournament]
  edit: [tournament: Tournament]
}>()

const { t, locale } = useI18n()

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled: 'bg-white/90 text-gray-900 dark:bg-gray-900/90 dark:text-white',
  ongoing: 'bg-green-500 text-white',
  finished: 'bg-gray-900/80 text-white dark:bg-white/15',
  cancelled: 'bg-red-500 text-white',
}

const DEFAULT_SURFACE =
  'bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10 dark:hover:ring-white/20'

// Beyond this the stack stops growing and the rest roll up into a "+N" chip.
const MAX_AVATARS = 3

// Cover and thumbnail are both optional, so cards fall back to a placeholder.
const image = computed<string | null>(
  () => props.tournament.cover || props.tournament.thumbnail || null,
)

const slotsLeft = computed<number>(() => remainingSlots(props.tournament))

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

// Above this share of the slots taken the bar warns that spots are running out.
const NEARLY_FULL_PERCENTAGE = 80

// Green while there is room, amber close to the limit, grey once it is full.
const fillClasses = computed<string>(() => {
  if (isFull.value) return 'bg-gray-400 dark:bg-white/30'
  if (fillPercentage.value >= NEARLY_FULL_PERCENTAGE)
    return 'bg-amber-500 dark:bg-amber-400'
  return 'bg-primary-500 dark:bg-purple-400'
})

// Only tournaments that haven't started yet are open for sign-ups.
const isOpen = computed<boolean>(
  () => props.tournament.status === TournamentStatus.scheduled && !isFull.value,
)

// The people the current user signed up for this tournament.
const signedUp = computed<
  { id: string; name: string; initials: string; fromTicket: boolean }[]
>(() =>
  props.participants.map((participant) => {
    const name =
      participantDisplayName(participant) ||
      t('public.tournaments.unnamedParticipant')

    return {
      id: participant.id,
      name,
      initials: participantInitials(name),
      fromTicket: !!participant.ticketIssuanceId,
    }
  }),
)

const visibleAvatars = computed(() => signedUp.value.slice(0, MAX_AVATARS))

const hiddenAvatarCount = computed<number>(() =>
  Math.max(signedUp.value.length - MAX_AVATARS, 0),
)

const startsAt = computed<string>(() =>
  DateTime.fromISO(props.tournament.startsAt)
    .setLocale(locale.value)
    .toLocaleString({
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
)
</script>

<template>
  <!-- Always a card; the contents just lay out as a row on phones so the
       list stays scannable, and stack once there is room -->
  <article
    class="group relative flex flex-row rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg sm:flex-col sm:hover:-translate-y-0.5"
    :class="DEFAULT_SURFACE"
  >
    <!-- The whole card opens the details. A stretched button rather than a
         click handler on the article: one focusable element, one accessible
         name, and the real controls below simply sit above it. -->
    <button
      type="button"
      class="absolute inset-0 z-0 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
      @click="emit('details', tournament)"
    >
      <span class="sr-only">
        {{ t('public.tournaments.details.view', { title: tournament.title }) }}
      </span>
    </button>

    <!-- Cover — full bleed against the card edge: rounded here rather than
         clipped by the card, which must stay unclipped for the popover.
         Stretches to the card height on phones, then caps at 4:3 from sm up. -->
    <div
      class="relative w-32 shrink-0 overflow-hidden rounded-l-2xl bg-gray-100 sm:aspect-4/3 sm:w-full sm:rounded-b-none sm:rounded-t-2xl dark:bg-white/5"
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
        class="flex size-full items-center justify-center bg-linear-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20"
      >
        <IconTrophy
          class="size-8 text-primary-400/80 sm:size-14 dark:text-white/20"
        />
      </div>

      <!-- Status — the only overlay, so it still reads on a narrow thumbnail -->
      <span
        class="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs"
        :class="STATUS_BADGE[tournament.status]"
      >
        <span
          v-if="tournament.status === TournamentStatus.ongoing"
          class="size-1.5 animate-pulse rounded-full bg-current"
        />
        {{ t(`public.tournaments.status.${tournament.status}`) }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div>
        <h3
          class="font-display font-semibold text-gray-900 dark:text-white line-clamp-2"
        >
          {{ tournament.title }}
        </h3>
        <p
          v-if="tournament.organizer"
          class="hidden sm:block mt-1 truncate text-sm text-gray-500 dark:text-gray-400"
        >
          {{ tournament.organizer }}
        </p>
      </div>

      <dl class="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-center gap-2">
          <dt class="sr-only">{{ t('public.tournaments.date') }}</dt>
          <IconCalendar class="size-4 shrink-0 text-gray-400" />
          <dd class="truncate">{{ startsAt }}</dd>
        </div>
        <div v-if="tournament.place" class="hidden sm:flex items-center gap-2">
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
          <span class="inline-flex shrink-0 items-center gap-1.5">
            <IconUsers class="size-4" />
            {{ tournament.participants }} / {{ tournament.maxParticipants }}
          </span>
          <span class="truncate">
            {{ t(`public.tournaments.format.${tournament.format}`) }}
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

      <!-- People the current user signed up -->
      <!-- Wraps rather than squashes: the narrowest phone plus a "+N" chip
           and the edit button together can outgrow the row -->
      <div
        v-if="signedUp.length"
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <Popover class="relative z-10 shrink-0">
          <!-- Faces, not a count: a second number here would collide with the
               occupancy figure right above, and "who" is the useful part.
               The aria-label is the only accessible name now that the visible
               text is gone, so it carries the count. -->
          <PopoverButton
            :aria-label="
              t('public.tournaments.yourSignUps', { count: signedUp.length })
            "
            class="group/signups flex cursor-pointer -space-x-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <CAvatar
              v-for="participant in visibleAvatars"
              :key="participant.id"
              size="xs"
              shape="circle"
              :initials="participant.initials"
              :alt="participant.name"
              class="ring-2 ring-white transition-colors group-hover/signups:ring-primary-300 dark:ring-gray-900 dark:group-hover/signups:ring-primary-400/50"
            />
            <span
              v-if="hiddenAvatarCount"
              class="inline-flex size-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 ring-2 ring-white transition-colors group-hover/signups:ring-primary-300 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-900 dark:group-hover/signups:ring-primary-400/50"
            >
              +{{ hiddenAvatarCount }}
            </span>
          </PopoverButton>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <PopoverPanel
              class="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-56 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
            >
              <ul class="space-y-0.5">
                <li
                  v-for="participant in signedUp"
                  :key="participant.id"
                  class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200"
                >
                  <CAvatar
                    size="xs"
                    shape="circle"
                    :initials="participant.initials"
                    :alt="participant.name"
                    class="shrink-0"
                  />
                  <span class="truncate" :title="participant.name">
                    {{ participant.name }}
                  </span>
                  <!-- The avatars are uniform now, so the ticket marker moves
                       to the trailing edge rather than being lost -->
                  <IconTicket
                    v-if="participant.fromTicket"
                    class="ml-auto size-4 shrink-0 text-primary-500"
                    :aria-label="t('public.tournaments.fromTicket')"
                  />
                </li>
              </ul>
            </PopoverPanel>
          </transition>
        </Popover>

        <CButton
          variant="soft"
          size="lg"
          class="relative z-10 shrink-0"
          @click="emit('edit', tournament)"
        >
          <template #icon-left>
            <IconPencil class="size-4" />
          </template>
          {{ t('public.tournaments.editSignUps') }}
        </CButton>
      </div>

      <!-- Once signed up, the strip above is the way in: it edits the sign-up -->
      <CButton
        v-if="canJoin && !signedUp.length"
        full-width
        size="lg"
        variant="soft"
        class="relative z-10"
        :disabled="!isOpen"
        @click="emit('join', tournament)"
      >
        <template #icon-left>
          <IconUserPlus class="size-4" />
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
