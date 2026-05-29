<script setup lang="ts">
import { IconArrowRight, IconDice5 } from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/routeNames.js'
import { useI18n } from 'vue-i18n'
import type { LibraryGame } from '@/features/library/games/game.model.js'

const { t } = useI18n()

interface Props {
  games: LibraryGame[]
  sectionId: string
}

defineProps<Props>()

function getGameCardClass(index: number): string {
  const pattern: string[] = [
    'row-span-2 lg:col-span-2 lg:row-span-2',
    'row-span-2',
    'row-span-1',
    'row-span-2',
    'row-span-1 lg:col-span-2',
    'row-span-2',
    'row-span-1',
    'row-span-2',
    'row-span-1',
  ]

  return pattern[index % pattern.length] ?? 'row-span-1'
}
</script>

<template>
  <section :id="sectionId" class="relative overflow-hidden py-32">
    <div class="absolute inset-0 0" />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]"
    />

    <div class="relative z-10 mx-auto max-w-7xl px-4">
      <!-- Section Header -->
      <div class="flex items-end justify-between">
        <div>
          <h2
            class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400"
          >
            {{ t('landing.games.sectionTitle') }}
          </h2>
          <p
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            {{ t('landing.games.sectionSubtitle') }}
          </p>
        </div>
        <RouterLink
          :to="{ name: RouteNames.public.library }"
          class="hidden items-center gap-2 text-sm font-medium text-gray-600 dark:text-white/60 transition-colors hover:text-indigo-600 dark:hover:text-white sm:flex"
        >
          {{ t('landing.games.viewAll') }}
          <IconArrowRight class="h-4 w-4" />
        </RouterLink>
      </div>

      <!-- Games Grid -->
      <div
        class="mt-12 grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[170px] sm:grid-cols-3 sm:gap-5 lg:auto-rows-[180px] lg:grid-cols-5"
      >
        <RouterLink
          v-for="(game, index) in games"
          :key="game.id"
          :class="[
            'group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-none transition-all duration-300 hover:ring-indigo-300 dark:hover:ring-white/20 hover:shadow-xl',
            getGameCardClass(index),
          ]"
          :to="{ name: RouteNames.public.library }"
        >
          <!-- Game Image -->
          <div class="h-full overflow-hidden">
            <img
              v-if="game.game?.image"
              :src="game.game.image"
              :alt="game.game?.name"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50"
            >
              <IconDice5 class="h-16 w-16 text-violet-300 dark:text-white/20" />
            </div>
          </div>

          <!-- Overlay -->
          <div
            class="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent dark:from-gray-950 dark:via-gray-950/50"
          />

          <!-- Content -->
          <div class="absolute inset-x-0 bottom-0 p-4">
            <h3 class="text-lg font-semibold text-white">
              {{ game.game?.name }}
            </h3>
            <div class="mt-2 flex items-center gap-2">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  game.status === 'available'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-500/20 text-gray-400',
                ]"
              >
                {{
                  game.status === 'available'
                    ? t('landing.games.available')
                    : game.status
                }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Mobile CTA -->
      <div class="mt-8 text-center sm:hidden">
        <RouterLink
          :to="{ name: RouteNames.public.library }"
          class="inline-flex items-center gap-2 rounded-full bg-gray-900/10 dark:bg-white/10 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white transition-colors hover:bg-gray-900/20 dark:hover:bg-white/20"
        >
          {{ t('landing.games.viewAll') }}
          <IconArrowRight class="h-4 w-4" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
