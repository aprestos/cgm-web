<script setup lang="ts">
import { computed } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronUpDownIcon } from '@heroicons/vue/24/outline'
import { IconLogout } from '@tabler/icons-vue'
import { useRouter } from 'vue-router'
import { authService } from '@/features/auth/service'
import { RouteNames } from '@/router/routeNames'
import type { User } from '@/features/auth/user.model.ts'

const props = defineProps<{
  user: User | null
}>()

const router = useRouter()

const userName = computed(
  () => props.user?.name || props.user?.email?.split('@')[0] || 'User',
)

const handleSignOut = async (): Promise<void> => {
  try {
    await authService.signOut()
    void router.push({ name: RouteNames.public.library })
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<template>
  <div class="">
    <Menu as="div" class="relative">
      <MenuButton
        class="flex w-full items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5 cursor-pointer"
      >
        <div
          class="size-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium uppercase dark:bg-indigo-500"
        >
          {{ userName[0] }}
        </div>
        <div class="flex flex-1 flex-col items-start">
          <span class="sr-only">Your profile</span>
          <span aria-hidden="true">{{ userName }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">Admin</span>
        </div>
        <ChevronUpDownIcon class="size-5 text-gray-400" aria-hidden="true" />
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
          class="absolute top-full mt-2 lg:top-auto lg:bottom-full lg:mt-0 lg:mb-2 left-0 right-0 mx-6 w-auto origin-top lg:origin-bottom rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg outline-1 outline-black/5 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
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
                @click="handleSignOut"
              >
                <IconLogout
                  :class="[
                    active
                      ? 'text-gray-500 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500',
                    'mr-3 size-5',
                  ]"
                  aria-hidden="true"
                />
                Sign out
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>
