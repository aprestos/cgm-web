<script setup lang="ts">
import { computed, watch } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { libraryWithdrawService } from '@/features/library/withdraws/service.ts'
import type { LibraryWithdraw } from '@/features/library/withdraws/service.ts'
import { userService } from '@/features/users/service.ts'
import type { User } from '@/features/users/service.ts'
import { useTimeAgo } from '@vueuse/core'
import { IconHourglassHigh } from '@tabler/icons-vue'
import { toast } from 'vue-sonner'

const { t } = useI18n()

interface Props {
  open: boolean
  selectedGame: LibraryGame | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const activeWithdraw = ref<LibraryWithdraw | null>(null)
const withdrawUser = ref<User | null>(null)
const isLoadingWithdraw = ref(false)
const isReturningGame = ref(false)

const withdrawDate = computed(() => {
  if (!activeWithdraw.value?.started_at) return null
  return useTimeAgo(activeWithdraw.value?.started_at)
})

// Fetch active withdraw and user when dialog opens
watch(
  () => [props.open, props.selectedGame],
  async () => {
    if (props.open && props.selectedGame) {
      isLoadingWithdraw.value = true
      activeWithdraw.value = null
      withdrawUser.value = null

      try {
        const withdraw = await libraryWithdrawService.getActiveByLibraryGameId(
          props.selectedGame.id,
        )
        if (withdraw) {
          activeWithdraw.value = withdraw
          // Fetch user information
          withdrawUser.value = await userService.getById(withdraw.user_id)
        }
      } catch (error) {
        console.error('Error fetching withdraw details:', error)
      } finally {
        isLoadingWithdraw.value = false
      }
    }
  },
  { immediate: true },
)

async function handleConfirm(): Promise<void> {
  isReturningGame.value = true
  try {
    await returnGame()
    emit('close')
  } finally {
    isReturningGame.value = false
  }
}

const returnGame = async (): Promise<void> => {
  if (!props.selectedGame?.id) return

  try {
    await libraryWithdrawService.returnGame(props.selectedGame?.id)
    toast.success(
      t('admin.library.returnSuccess', { name: props.selectedGame.game.name }),
    )
  } catch (error) {
    console.error('Failed to return game:', error)
    toast.error(t('admin.library.returnFailed'))
    throw error
  }
}
</script>

<template>
  <ConfirmationDialog
    :open="open"
    :title="t('admin.library.returnGame')"
    :confirm-text="t('admin.library.yesReturnIt')"
    :cancel-text="t('common.cancel')"
    :loading="isReturningGame"
    @confirm="handleConfirm"
    @cancel="emit('close')"
    @close="emit('close')"
  >
    <template #default>
      <div class="space-y-3">
        <!-- Game Card -->
        <div
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
        >
          <img
            class="size-16 rounded-lg object-cover shadow-sm shrink-0"
            :src="selectedGame?.game.image || '/placeholder-game.jpg'"
            :alt="selectedGame?.game.name || t('admin.library.unknownGame')"
          />
          <div class="flex-1 min-w-0">
            <h3
              class="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2"
            >
              {{ selectedGame?.game.name || t('admin.library.unknownGame') }}
            </h3>
            <div
              v-if="selectedGame?.location?.name"
              class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
            >
              <svg
                class="size-3.5 shrink-0 text-gray-500 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{{ selectedGame.location.name }}</span>
            </div>
          </div>
        </div>

        <!-- User Card - Loading State -->
        <div
          v-if="isLoadingWithdraw"
          class="animate-pulse p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div
              class="size-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"
            ></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
            </div>
          </div>
        </div>

        <!-- User Card - Loaded -->
        <div
          v-else-if="withdrawUser"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
        >
          <img
            v-if="withdrawUser.avatar_url"
            class="size-12 rounded-full object-cover shadow-sm shrink-0"
            :src="withdrawUser.avatar_url"
            :alt="withdrawUser.name || withdrawUser.email"
          />
          <div
            v-else
            class="size-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0"
          >
            <span
              class="text-lg font-semibold text-primary-700 dark:text-primary-300"
            >
              {{
                (withdrawUser.name || withdrawUser.email)
                  .charAt(0)
                  .toUpperCase()
              }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4
              class="text-sm font-semibold text-gray-900 dark:text-white mb-1"
            >
              {{ withdrawUser.name || withdrawUser.email }}
            </h4>
            <div
              v-if="withdrawDate"
              class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"
            >
              <IconHourglassHigh class="size-4" />
              <span>{{ withdrawDate }}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation Message -->
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
          {{ t('admin.library.areYouSureReturn') }}
        </p>
      </div>
    </template>
  </ConfirmationDialog>
</template>
