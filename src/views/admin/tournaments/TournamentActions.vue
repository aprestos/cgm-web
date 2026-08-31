<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUsers,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { Tournament } from '@/features/tournaments/tournament.model.ts'

const { t } = useI18n()

const props = defineProps<{ tournament: Tournament }>()

const emit = defineEmits<{
  edit: [tournament: Tournament]
  participants: [tournament: Tournament]
  delete: [tournament: Tournament]
}>()

const ITEM_BASE = 'flex w-full items-center px-4 py-2 text-sm cursor-pointer'
</script>

<template>
  <Menu as="div" class="relative inline-block shrink-0 text-left">
    <MenuButton
      :aria-label="
        t('admin.tournaments.actions.menu', { title: props.tournament.title })
      "
      class="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus:outline-blue-400"
    >
      <IconDotsVertical class="size-5" aria-hidden="true" />
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
        class="absolute right-0 z-20 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
      >
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <button
              type="button"
              :class="[
                active
                  ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300',
                ITEM_BASE,
              ]"
              @click="emit('edit', props.tournament)"
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
              {{ t('common.actions.edit') }}
            </button>
          </MenuItem>

          <MenuItem v-slot="{ active }">
            <button
              type="button"
              :class="[
                active
                  ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300',
                ITEM_BASE,
              ]"
              @click="emit('participants', props.tournament)"
            >
              <IconUsers
                :class="[
                  active
                    ? 'text-gray-500 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500',
                  'mr-3 size-5',
                ]"
                aria-hidden="true"
              />
              {{ t('admin.tournaments.actions.participants') }}
            </button>
          </MenuItem>
        </div>

        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <button
              type="button"
              :class="[
                active
                  ? 'bg-red-50 text-red-700 outline-hidden dark:bg-red-500/10 dark:text-red-300'
                  : 'text-red-600 dark:text-red-400',
                ITEM_BASE,
              ]"
              @click="emit('delete', props.tournament)"
            >
              <IconTrash class="mr-3 size-5" aria-hidden="true" />
              {{ t('common.actions.delete') }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<style scoped></style>
