<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogComponent from '@/components/DialogComponent.vue'
import type { LibraryWithdraw } from '@/features/library/withdraws/service.ts'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'
import { DateTime } from 'luxon'
import { IconCircleCheck, IconStopwatch, IconCalendar } from '@tabler/icons-vue'
import logger from '@/lib/logger.ts'
import { useTimeAgo } from '@vueuse/core'
import { userService } from '@/features/users/service.ts'
import WithdrawTimeline from '../../public/WithdrawTimeline.vue'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { RouteNames } from '@/router/routeNames.ts'
import { IconExternalLink } from '@tabler/icons-vue'

const { t } = useI18n()

interface Props {
  open: boolean
  selectedGame?: LibraryGame | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedGame: null,
})

const emit = defineEmits<{
  close: []
}>()

const withdraws = ref<LibraryWithdraw[]>([])
const isLoading = ref(false)
const isLoadingUsers = ref(false)

const users = ref<Map<string, string>>(new Map())

watch(
  () => props.open,
  async () => {
    // If libraryGameId is provided, load withdraws for this game
    if (props.selectedGame) {
      isLoading.value = true
      try {
        withdraws.value = await libraryWithdrawService.getByLibraryGameId(
          props.selectedGame.id,
        )
      } catch (error) {
        logger.error('Failed to load withdrawal history:', { error })
      } finally {
        isLoading.value = false
      }
    }

    isLoadingUsers.value = true

    for (const item of withdraws.value) {
      if (!users.value.has(item.user_id)) {
        try {
          const result = await userService.getById(item.user_id)
          const user = result?.name || result?.email || ''
          users.value.set(item.user_id, user)
        } catch {}
      }
    }
    isLoadingUsers.value = false
  },
)

function getDurationHours(
  startedAt: string | number,
  endedAt: string | number | null,
): number | null {
  try {
    const start =
      typeof startedAt === 'string'
        ? DateTime.fromISO(startedAt)
        : DateTime.fromMillis(Number(startedAt))
    if (!endedAt) return null
    const end =
      typeof endedAt === 'string'
        ? DateTime.fromISO(endedAt)
        : DateTime.fromMillis(Number(endedAt))
    return Math.round(end.diff(start, 'hours').hours * 10) / 10
  } catch {
    return null
  }
}
</script>

<template>
  <DialogComponent
    :open="open"
    :title="t('withdraw.history')"
    size="lg"
    @close="emit('close')"
  >
    <div class="overflow-hidden">
      <div v-if="isLoading" class="">
        <div class="space-y-6">
          <div class="animate-pulse">
            <div
              class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"
            ></div>
            <div class="space-y-4">
              <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="withdraws.length === 0" class="px-6 py-12 text-center">
        <div class="text-gray-500 dark:text-gray-400">
          <p class="text-lg font-medium mb-2">
            {{ t('admin.library.noWithdrawalsYet') }}
          </p>
          <p class="text-sm">{{ t('admin.library.gameNotWithdrawn') }}</p>
        </div>
      </div>

      <WithdrawTimeline v-else :withdraws="withdraws">
        <template #card="{ withdraw }">
          <div
            class="bg-gray-50 dark:bg-black/10 rounded-lg p-4 transition-shadow"
          >
            <!-- User Info -->
            <div class="flex items-start justify-between gap-2">
              <div>
                <div v-if="isLoadingUsers" class="animate-pulse">
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"
                  ></div>
                </div>
                <div v-else>
                  <div v-if="users && users.has(withdraw.user_id)">
                    <RouterLink
                      class="flex flex-row text-gray-900 dark:text-white"
                      target="_blank"
                      :to="{
                        name: RouteNames.public.user,
                        params: { id: withdraw.user_id },
                      }"
                    >
                      <h5 class="font-semibold truncate">
                        {{ users.get(withdraw.user_id) }}
                      </h5>
                      <IconExternalLink class="ml-1" />
                    </RouterLink>
                  </div>
                  <h5
                    v-else
                    class="font-normal text-gray-600 dark:text-gray-300 truncate"
                  >
                    {{ t('admin.library.unknownUser') }}
                  </h5>
                </div>

                <div
                  v-if="withdraw.ended_at"
                  class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  <IconStopwatch class="size-4" />
                  {{ getDurationHours(withdraw.started_at, withdraw.ended_at) }}
                  {{ t('admin.library.hours') }}
                </div>
                <div
                  v-else
                  class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  <IconCalendar class="size-4" />
                  <span>{{ useTimeAgo(withdraw.started_at) }}</span>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="flex-shrink-0">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                    withdraw.ended_at
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                  ]"
                >
                  <IconCircleCheck class="size-3.5" />
                  {{
                    withdraw.ended_at
                      ? t('admin.library.returned')
                      : t('admin.library.active')
                  }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </WithdrawTimeline>
    </div>
  </DialogComponent>
</template>
