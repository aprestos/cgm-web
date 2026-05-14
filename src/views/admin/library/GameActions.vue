<script setup lang="ts">
import {
  getStatus,
  type LibraryGame,
  type LibraryGameStatus,
} from '@/features/library/games/game.model.ts'
import {
  IconArrowBarUp,
  IconArrowBarToDownDashed,
  IconChevronsRight,
  IconCircleCheck,
  IconArchive,
  IconTrash,
  IconEdit,
  IconHistory,
  IconDotsVertical,
} from '@tabler/icons-vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import libraryService from '@/features/library/games/service.ts'

const { t } = useI18n()

// Use function overload signatures for defineEmits so we can have optional userId for withdraw-game
const emit = defineEmits<{
  (e: 'delete', game: LibraryGame): void
  (e: 'edit', game: LibraryGame): void
  (e: 'return', game: LibraryGame): void
  (e: 'withdraw', game: LibraryGame, userId?: string): void
  (e: 'move', game: LibraryGame): void
  (e: 'history', game: LibraryGame): void
}>()

const props = defineProps<{ data: LibraryGame }>()

const updateStatus = async (status: LibraryGameStatus): Promise<void> => {
  // Close the dialog - realtime will handle the list update
  const updatedGame: Partial<LibraryGame> = { status }
  await libraryService.updateGame(props.data.id, updatedGame)
}

const gameStatus = computed(() => {
  return getStatus(props.data)
})
</script>

<template>
  <div class="text-right">
    <span class="inline-flex rounded-md shadow-xs dark:shadow-none">
      <button
        v-show="gameStatus === 'withdrawn'"
        type="button"
        class="relative cursor-pointer inline-flex items-center gap-x-1.5 rounded-l-md bg-gray-100 px-4 py-3 md:px-3 md:py-2 text-sm font-semibold shadow-xs text-gray-600 dark:text-gray-200 ring-1 ring-gray-300 ring-inset hover:bg-gray-200 dark:bg-white/10 dark:ring-gray-700 dark:hover:bg-white/20 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 dark:focus:outline-blue-400"
        @click="emit('return', props.data)"
      >
        <IconArrowBarToDownDashed class="-ml-0.5 size-5" aria-hidden="true" />
        <span class="hidden md:inline">{{ t('admin.library.return') }}</span>
      </button>
      <button
        v-show="gameStatus === 'available'"
        type="button"
        class="relative cursor-pointer inline-flex items-center gap-x-1.5 rounded-l-md bg-gray-100 px-4 py-3 md:px-3 md:py-2 text-sm font-semibold shadow-xs text-gray-600 dark:text-gray-200 ring-1 ring-gray-300 ring-inset hover:bg-gray-200 dark:bg-white/10 dark:ring-gray-700 dark:hover:bg-white/20 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 dark:focus:outline-blue-400"
        @click="emit('withdraw', props.data)"
      >
        <IconArrowBarUp class="-ml-0.5 size-5" aria-hidden="true" />
        <span class="hidden md:inline">{{ t('admin.library.loan') }}</span>
      </button>
      <Menu as="div" class="relative inline-block">
        <MenuButton
          :class="[
            gameStatus === 'not-available' || gameStatus === 'reserved'
              ? 'rounded-md'
              : 'rounded-r-md',
            'inline-flex cursor-pointer ring-1 w-full justify-center -ml-px gap-x-1.5 bg-gray-100 px-4 py-3 md:px-3 md:py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/20 ring-gray-300 ring-inset inset-ring-1 inset-ring-gray-300 dark:ring-gray-700 dark:inset-ring-white/5 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 dark:focus:outline-blue-400',
          ]"
        >
          <IconDotsVertical class="size-5" />
        </MenuButton>

        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
            class="absolute right-0 z-15 mt-2 w-62 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          >
            <div class="py-1">
              <MenuItem v-slot="{ active }">
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="emit('history', props.data)"
                >
                  <IconHistory
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('admin.library.history') }}
                </a>
              </MenuItem>
            </div>
            <div class="py-1">
              <MenuItem v-slot="{ active }" class="cursor-not-allowed">
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="emit('edit', props.data)"
                >
                  <IconEdit
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('admin.library.edit') }}
                </a>
              </MenuItem>

              <MenuItem v-slot="{ active }">
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="emit('move', props.data)"
                >
                  <IconChevronsRight
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('admin.library.move') }}
                </a>
              </MenuItem>
              <MenuItem
                v-show="getStatus(props.data) === 'available'"
                v-slot="{ active }"
              >
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="updateStatus('not-available' as LibraryGameStatus)"
                >
                  <IconArchive
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('admin.library.markAsNotAvailable') }}
                </a>
              </MenuItem>
              <MenuItem
                v-show="getStatus(props.data) === 'not-available'"
                v-slot="{ active }"
              >
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="updateStatus('available' as LibraryGameStatus)"
                >
                  <IconCircleCheck
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('admin.library.markAsAvailable') }}
                </a>
              </MenuItem>
            </div>
            <div class="py-1">
              <MenuItem v-slot="{ active }">
                <a
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                  ]"
                  @click="emit('delete', props.data)"
                >
                  <IconTrash
                    :class="[
                      active
                        ? 'text-gray-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500',
                      'mr-3 size-5',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t('common.delete') }}
                </a>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </span>
  </div>
</template>

<style scoped></style>
