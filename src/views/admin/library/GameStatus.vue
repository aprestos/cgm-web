<script setup lang="ts">
import {
  getStatus,
  getStatusLabel,
  type LibraryGame,
} from '@/features/library/games/game.model.ts'
import CBadge from '@/components/CBadge.vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import libraryWithdrawService, {
  type LibraryWithdraw,
} from '@/features/library/withdraws/service.ts'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import {
  IconCheck,
  IconX,
  IconClockFilled,
  IconUserFilled,
  IconExclamationMark,
} from '@tabler/icons-vue'
import { useTimeAgo } from '@vueuse/core'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const { t } = useI18n()

const props = defineProps<{ data: LibraryGame }>()

const withdraw = ref<LibraryWithdraw | null>(null)
const isLoadingWithdraw = ref(false)

const status = computed(() => getStatus(props.data))

// Computed properties for safe template access
const withdrawDate = computed(() => {
  if (!withdraw.value?.started_at) return new Date().toLocaleDateString()
  return useTimeAgo(withdraw.value.started_at)
})

const fetchWithdrawDetails = async (): Promise<void> => {
  if (!withdraw.value) {
    isLoadingWithdraw.value = true
    withdraw.value = await libraryWithdrawService.getActiveByLibraryGameId(
      props.data.id,
    )
    isLoadingWithdraw.value = false
  }
}
</script>

<template>
  <Popover class="relative group">
    <PopoverButton
      class="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full"
    >
      <CBadge v-show="status === 'available'" type="green"
        ><span class="hidden md:inline">{{ getStatusLabel(props.data) }}</span
        ><span class="md:hidden"><IconCheck /></span
      ></CBadge>
      <CBadge
        v-show="status === 'withdrawn'"
        text=""
        type="yellow"
        @click="fetchWithdrawDetails"
        ><span class="hidden md:inline">{{ getStatusLabel(props.data) }}</span
        ><span class="md:hidden"><IconExclamationMark /></span
      ></CBadge>
      <CBadge
        v-show="status === 'not-available'"
        text="Not available"
        type="red"
      >
        <span class="hidden md:inline">{{ getStatusLabel(props.data) }}</span
        ><span class="md:hidden"><IconX /></span>
      </CBadge>
      <CBadge v-show="status === 'reserved'" text="Reserved" type="blue">
        <span class="hidden md:inline">{{ getStatusLabel(props.data) }}</span
        ><span class="md:hidden"><IconX /></span>
      </CBadge>
    </PopoverButton>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel
        class="absolute z-10 mt-2 w-64 rounded-lg bg-white ring-gray-200 p-4 shadow-lg ring-1 ring-opacity-5 focus:outline-none whitespace-normal"
      >
        <div class="space-y-3">
          <!-- Available Status -->
          <div
            v-if="getStatus(props.data) === 'available'"
            class="text-sm text-gray-600"
          >
            <h3 class="text-sm font-semibold text-gray-900">
              <CheckCircleIcon
                class="h-5 w-5 inline-block mr-1.5 text-green-500"
              />
              {{ t('game.status.availableForBorrowing') }}
            </h3>
            <p class="mt-2 text-xs text-gray-500">
              {{ t('game.status.canWithdrawFromLibrary') }}
            </p>
          </div>

          <!-- Withdrawn Status with Details -->
          <div
            v-else-if="getStatus(props.data) === 'withdrawn'"
            class="space-y-2"
          >
            <div v-if="withdraw" class="text-sm">
              <h3 class="text-sm font-semibold text-gray-900">
                {{ t('game.status.withdrawnFromLibrary') }}
              </h3>
              <p class="text-gray-600 mb-2"></p>

              <div class="space-y-2 text-sm">
                <div class="flex flex-row">
                  <IconClockFilled class="mr-2" size="18" />
                  <span v-if="!isLoadingWithdraw">{{ withdrawDate }}</span>
                  <SkeletonLoader v-else class="inline-block w-20 h-4" />
                </div>
                <div class="flex flex-row">
                  <IconUserFilled class="mr-2" size="18" />
                  <span v-if="!isLoadingWithdraw && withdraw?.user?.name">{{
                    withdraw.user.name
                  }}</span>
                  <SkeletonLoader v-else class="inline-block w-24 h-4" />
                </div>
              </div>
            </div>
            <div v-else-if="isLoadingWithdraw" class="text-sm text-gray-600">
              <div class="space-y-2">
                <SkeletonLoader class="h-4 w-48" />
                <SkeletonLoader class="h-3 w-32" />
                <SkeletonLoader class="h-3 w-40" />
              </div>
            </div>
            <div v-else class="text-sm text-gray-600">
              <p>{{ t('game.status.currentlyWithdrawn') }}</p>
            </div>
          </div>

          <!-- Not Available Status -->
          <div
            v-else-if="getStatus(props.data) === 'not-available'"
            class="text-sm text-gray-600"
          >
            <p>
              <XCircleIcon class="h-5 w-5 inline-block mr-1.5 text-red-500" />
              {{ t('game.status.currentlyNotAvailable') }}
            </p>
            <p class="mt-2 text-xs text-gray-500">
              {{ t('game.status.underMaintenanceOrUnavailable') }}
            </p>
          </div>

          <!-- Reserved Status -->
          <div
            v-else-if="getStatus(props.data) === 'reserved'"
            class="text-sm text-gray-600"
          >
            <p>
              <ClockIcon class="h-5 w-5 inline-block mr-1.5 text-blue-500" />
              {{ t('game.status.reservedByAnotherUser') }}
            </p>
            <p class="mt-2 text-xs text-gray-500">
              {{ t('game.status.checkBackLater') }}
            </p>
          </div>

          <div class="border-t border-gray-200 pt-3">
            <p class="text-xs text-gray-500">
              {{ t('game.status.lastUpdated') }}: {{ useTimeAgo(new Date()) }}
            </p>
          </div>
        </div>
      </PopoverPanel>
    </Transition>
  </Popover>
</template>

<style scoped></style>
