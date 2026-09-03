<script setup lang="ts">
/**
 * The head of a tournament wherever it is shown: the cover art, the status and
 * format it carries, its name and who runs it. One block, so the public
 * dialog, the admin editor and the create preview cannot drift apart.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type CreateTournament, TournamentStatus } from '../tournament.model.ts'

interface Props {
  tournament: CreateTournament
  /** Overrides the stored cover — a local preview of a file not yet uploaded. */
  cover?: string
  /** Stands in while the name is still blank, as it is in the create preview. */
  placeholderTitle?: string
  /** Tighter spacing for a narrow column. */
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cover: undefined,
  placeholderTitle: undefined,
  dense: false,
})

const { t } = useI18n()

const STATUS_BADGE: Record<TournamentStatus, string> = {
  scheduled: 'bg-white/90 text-gray-900 dark:bg-gray-900/90 dark:text-white',
  ongoing: 'bg-green-500 text-white',
  finished: 'bg-gray-900/80 text-white dark:bg-white/15',
  cancelled: 'bg-red-500 text-white',
}

const image = computed<string | undefined>(
  () =>
    props.cover ||
    props.tournament.cover ||
    props.tournament.thumbnail ||
    undefined,
)

const name = computed<string>(() => props.tournament.title.trim())

// Photos are unpredictable, so anything sitting on one goes white over the
// scrim; without one the block falls back to the panel's own colours.
const title = computed<string>(() => name.value || props.placeholderTitle || '')
</script>

<template>
  <div
    class="relative flex flex-col justify-end"
    :class="[
      dense ? 'p-4' : 'px-4 py-5 sm:px-6',
      image
        ? dense
          ? 'min-h-36 overflow-hidden'
          : 'min-h-44 overflow-hidden sm:min-h-52'
        : 'border-b border-gray-100 dark:border-white/10',
    ]"
  >
    <template v-if="image">
      <img
        :src="image"
        alt=""
        aria-hidden="true"
        decoding="async"
        class="absolute inset-0 size-full object-cover"
      />
      <div
        class="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/25"
      />
    </template>

    <div class="z-10 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur"
            :class="STATUS_BADGE[tournament.status]"
          >
            <span
              v-if="tournament.status === TournamentStatus.ongoing"
              class="size-1.5 animate-pulse rounded-full bg-current"
            />
            {{ t(`public.tournaments.status.${tournament.status}`) }}
          </span>
          <!-- The format only has somewhere to sit once there is art behind
               it; without one it would just crowd the title. -->
          <span
            v-if="image"
            class="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur"
          >
            {{ t(`public.tournaments.format.${tournament.format}`) }}
          </span>
        </div>

        <h3
          v-if="title"
          class="mt-2 font-display font-bold"
          :class="[
            dense ? 'text-lg' : 'text-xl',
            image
              ? 'text-white drop-shadow-sm'
              : name
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500',
          ]"
        >
          {{ title }}
        </h3>

        <p
          v-if="tournament.organizer"
          class="mt-1 min-w-0 truncate text-sm"
          :class="
            image
              ? 'text-white/80 drop-shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          {{
            t('public.tournaments.organizedBy', { name: tournament.organizer })
          }}
        </p>
      </div>

      <!-- `onCover` so an action can pick a treatment that survives the art -->
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" :on-cover="!!image" />
      </div>
    </div>
  </div>
</template>
