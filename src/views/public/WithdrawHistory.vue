<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { LibraryWithdraw } from '@/features/library/withdraws/service.ts'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'
import { DateTime } from 'luxon'
import { IconCalendar, IconCircleCheck, IconStopwatch } from '@tabler/icons-vue'
import logger from '@/lib/logger.ts'
import { useTimeAgo } from '@vueuse/core'
import { userService } from '@/features/users/service.ts'

interface Props {
  libraryGameId?: number
}

const props = withDefaults(defineProps<Props>(), {
  libraryGameId: undefined,
})

const withdraws = ref<LibraryWithdraw[]>([])
const isLoading = ref(false)
const isLoadingUsers = ref(false)

const users = ref<Map<string, string>>(new Map())

onMounted(async () => {
  // If libraryGameId is provided, load withdraws for this game
  if (props.libraryGameId) {
    isLoading.value = true
    try {
      withdraws.value = await libraryWithdrawService.getByLibraryGameId(
        props.libraryGameId,
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
      const user = await userService.getById(item.user_id)
      users.value.set(item.user_id, user?.name || user?.email || '')
    }
  }
  isLoadingUsers.value = false
})

function getDay(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === 'string'
        ? DateTime.fromISO(dateStr)
        : DateTime.fromMillis(Number(dateStr))
    return date.toFormat('dd')
  } catch {
    return '--'
  }
}

function getMonth(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === 'string'
        ? DateTime.fromISO(dateStr)
        : DateTime.fromMillis(Number(dateStr))
    return date.toFormat('MMM')
  } catch {
    return '---'
  }
}

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
  <div class="overflow-hidden">
    <div v-if="isLoading" class="">
      <div class="space-y-6">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
          <div class="space-y-4">
            <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="withdraws.length === 0" class="px-6 py-12 text-center">
      <div class="text-gray-500 dark:text-gray-400">
        <p class="text-lg font-medium mb-2">No withdrawals yet</p>
        <p class="text-sm">This game has not been withdrawn by any user</p>
      </div>
    </div>

    <div v-else class="">
      <div class="relative">
        <!-- Continuous timeline line -->
        <div
          class="absolute left-20 top-3 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"
        ></div>

        <!-- Users list -->
        <div class="space-y-6">
          <div
            v-for="withdraw in withdraws"
            :key="withdraw.id"
            class="flex gap-4 relative"
          >
            <!-- Day badge -->
            <div class="w-16 flex-shrink-0 text-center pt-1">
              <div
                class="rounded-lg bg-primary-100 dark:bg-primary-900/30 px-2 py-1"
              >
                <div
                  class="text-sm font-bold text-primary-600 dark:text-primary-400"
                >
                  {{ getDay(withdraw.started_at) }}
                </div>
                <div
                  class="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wider"
                >
                  {{ getMonth(withdraw.started_at) }}
                </div>
              </div>
            </div>

            <!-- Timeline dot -->
            <div class="flex flex-col items-center pt-1">
              <div
                :class="[
                  'w-3 h-3 rounded-full ring-4 relative z-10',
                  withdraw.ended_at
                    ? 'bg-green-500 ring-white dark:ring-gray-900'
                    : 'bg-blue-500 ring-white dark:ring-gray-900',
                ]"
              ></div>
            </div>

            <!-- User Card -->
            <div class="flex-1 pb-4">
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
                    <h5
                      v-else
                      class="font-semibold text-gray-900 dark:text-white truncate"
                    >
                      {{
                        (users && users.get(withdraw.user_id)) || 'Unknown User'
                      }}
                    </h5>

                    <div
                      v-if="withdraw.ended_at"
                      class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1"
                    >
                      <IconStopwatch class="size-4" />
                      {{
                        getDurationHours(withdraw.started_at, withdraw.ended_at)
                      }}
                      hours
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
                      {{ withdraw.ended_at ? 'Returned' : 'Active' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
