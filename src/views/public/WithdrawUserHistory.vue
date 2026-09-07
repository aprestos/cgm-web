<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LibraryWithdraw } from '@/features/library/withdraws/service.ts'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'
import { DateTime } from 'luxon'
import { IconCalendar, IconCircleCheck } from '@tabler/icons-vue'
import { toast } from 'vue-sonner'
import WithdrawTimeline from './WithdrawTimeline.vue'
import { useEditionStore } from '@/features/events/edition.store'

const editionStore = useEditionStore()

const { t } = useI18n()

interface Props {
  userId?: string
  withdraws?: Map<number, LibraryWithdraw[]>
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userId: undefined,
  withdraws: undefined,
  isLoading: false,
})

const localWithdraws = ref<LibraryWithdraw[]>([])
const isLoadingLocal = ref(false)

const displayIsLoading = computed(() => {
  return props.isLoading || isLoadingLocal.value
})

const currentEventWithdraws = computed(() => {
  const editionId = editionStore.edition?.id

  if (props.withdraws && editionId && props.withdraws.has(editionId)) {
    return props.withdraws.get(editionId) || []
  } else {
    return []
  }
})

onMounted(async () => {
  // If userId is provided, load withdraws for this user
  if (props.userId) {
    isLoadingLocal.value = true
    try {
      localWithdraws.value = await libraryWithdrawService.getByUserId(
        props.userId,
      )
    } catch (error) {
      console.error('Failed to load withdrawal history:', error)
      toast.error('Failed to load withdrawal history')
    } finally {
      isLoadingLocal.value = false
    }
  }
})

function formatDate(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === 'string'
        ? DateTime.fromISO(dateStr)
        : DateTime.fromMillis(Number(dateStr))
    return date.toFormat('MMM dd, yyyy HH:mm')
  } catch {
    return 'Invalid date'
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
  <div
    class="md:bg-white md:dark:bg-gray-800 md:rounded-2xl md:shadow-lg overflow-hidden"
  >
    <div class="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('public.withdraw.history') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ currentEventWithdraws.length }}
        {{
          currentEventWithdraws.length === 1
            ? t('public.withdraw.totalWithdrawals')
            : t('public.withdraw.totalWithdrawalsPlural')
        }}
      </p>
    </div>

    <div v-if="displayIsLoading" class="px-6 py-12">
      <div class="space-y-6">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
          <div class="space-y-4">
            <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentEventWithdraws.length === 0"
      class="px-6 py-12 text-center"
    >
      <div class="text-gray-500 dark:text-gray-400">
        <p class="text-lg font-medium mb-2">
          {{ t('public.withdraw.noWithdrawalsYet') }}
        </p>
        <p class="text-sm">{{ t('public.withdraw.noWithdrawalsMessage') }}</p>
      </div>
    </div>

    <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
      <div class="px-6 py-8">
        <!-- Tenant Header -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {{ editionStore.edition?.name }}
          </h3>

          <!-- Edition Groups -->
          <div class="space-y-8">
            <div>
              <!-- Edition Header -->
              <div v-if="currentEventWithdraws.length > 0" class="mb-4">
                <!-- Timeline -->
                <WithdrawTimeline :withdraws="currentEventWithdraws">
                  <template #card="{ withdraw }">
                    <div
                      class="bg-gray-50 dark:bg-black/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div class="flex gap-4">
                        <!-- Game Image -->
                        <div
                          v-if="withdraw.library_game?.game?.image"
                          class="flex-shrink-0"
                        >
                          <img
                            :src="withdraw.library_game.game.image"
                            :alt="withdraw.library_game.game.name"
                            class="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>

                        <!-- Withdraw Details -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-start justify-between gap-2">
                            <div>
                              <h5
                                class="font-semibold text-gray-900 dark:text-white truncate"
                              >
                                {{
                                  withdraw.library_game?.game?.name ||
                                  `Game ${withdraw.library_game_id}`
                                }}
                              </h5>
                              <div
                                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1"
                              >
                                <IconCalendar class="size-4" />
                                <span>{{
                                  formatDate(withdraw.started_at)
                                }}</span>
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
                                    ? t('public.withdraw.returned')
                                    : t('public.withdraw.active')
                                }}
                              </span>
                            </div>
                          </div>

                          <!-- Return Info -->
                          <div
                            v-if="withdraw.ended_at"
                            class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                          >
                            <div
                              class="flex items-center justify-between text-sm"
                            >
                              <div class="text-gray-600 dark:text-gray-400">
                                {{ t('public.withdraw.returnedOn') }}
                                {{ formatDate(withdraw.ended_at) }}
                              </div>
                              <div
                                v-if="
                                  getDurationHours(
                                    withdraw.started_at,
                                    withdraw.ended_at,
                                  )
                                "
                                class="text-gray-600 dark:text-gray-400 font-medium"
                              >
                                {{
                                  getDurationHours(
                                    withdraw.started_at,
                                    withdraw.ended_at,
                                  )
                                }}
                                {{ t('public.withdraw.hours') }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </WithdrawTimeline>
              </div>
              <div v-else>
                <WithdrawTimeline :withdraws="currentEventWithdraws">
                  <template #card="{ withdraw }">
                    <div
                      class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div class="flex gap-4">
                        <!-- Game Image -->
                        <div
                          v-if="withdraw.library_game?.game?.image"
                          class="flex-shrink-0"
                        >
                          <img
                            :src="withdraw.library_game.game.image"
                            :alt="withdraw.library_game.game.name"
                            class="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>

                        <!-- Withdraw Details -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-start justify-between gap-2">
                            <div>
                              <h5
                                class="font-semibold text-gray-900 dark:text-white truncate"
                              >
                                {{
                                  withdraw.library_game?.game?.name ||
                                  `Game ${withdraw.library_game_id}`
                                }}
                              </h5>
                              <div
                                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1"
                              >
                                <IconCalendar class="size-4" />
                                <span>{{
                                  formatDate(withdraw.started_at)
                                }}</span>
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
                                    ? t('public.withdraw.returned')
                                    : t('public.withdraw.active')
                                }}
                              </span>
                            </div>
                          </div>

                          <!-- Return Info -->
                          <div
                            v-if="withdraw.ended_at"
                            class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                          >
                            <div
                              class="flex items-center justify-between text-sm"
                            >
                              <div class="text-gray-600 dark:text-gray-400">
                                {{ t('public.withdraw.returnedOn') }}
                                {{ formatDate(withdraw.ended_at) }}
                              </div>
                              <div
                                v-if="
                                  getDurationHours(
                                    withdraw.started_at,
                                    withdraw.ended_at,
                                  )
                                "
                                class="text-gray-600 dark:text-gray-400 font-medium"
                              >
                                {{
                                  getDurationHours(
                                    withdraw.started_at,
                                    withdraw.ended_at,
                                  )
                                }}
                                {{ t('public.withdraw.hours') }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </WithdrawTimeline>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
