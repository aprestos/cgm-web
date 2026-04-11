<script setup lang="ts">
import { computed } from 'vue'
import { tenantStore } from '@/stores/tenant.ts'
import { useRoute, useRouter } from 'vue-router'
import type { User } from '@/features/auth/user.model.ts'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronUpDownIcon } from '@heroicons/vue/24/outline'
import { IconLogout } from '@tabler/icons-vue'
import { authService } from '@/features/auth/service'
import { RouteNames } from '@/router/routeNames'
import { useI18n } from 'vue-i18n'
import type { NavigationItem } from '@/navigation/navigation.model.ts'
const { t } = useI18n()

interface PublicPage {
  id: string
  routeName: string
  initial: string
  enabled: boolean
}

const props = defineProps<{
  topNavigation: NavigationItem[]
  bottomNavigation: NavigationItem[]
  publicPages: PublicPage[]
  user: User | null
}>()

defineEmits<{
  close: []
}>()

const route = useRoute()
const router = useRouter()

const userName = computed(() => {
  return props.user?.name || props.user?.email?.split('@')[0] || 'User'
})

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
  <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
    <!-- Sidebar component, swap this element with another sidebar if you like -->
    <div
      class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/5"
    >
      <router-link :to="{ name: RouteNames.public.home }">
        <div class="flex h-16 shrink-0 items-center">
          <!-- Logo SkeletonLoader -->
          <!--        <SkeletonLoader v-if="!tenantStore?.logo" width="128px" height="32px" />-->
          <!-- Actual Logo -->
          <img
            class="h-10 w-auto"
            :src="tenantStore?.logo || '@/assets/logoipsum-381.svg'"
            :alt="tenantStore?.name + ' logo'"
          />
        </div>
      </router-link>
      <nav class="flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" class="-mx-2 space-y-1">
              <li v-for="item in topNavigation" :key="item.routeName">
                <RouterLink
                  v-if="item.enabled"
                  :to="{ name: item.routeName }"
                  :class="[
                    route.name === item.routeName
                      ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                    'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                  ]"
                >
                  <component
                    :is="item.icon"
                    stroke="1.5"
                    :class="[
                      route.name === item.routeName
                        ? 'text-indigo-600 dark:text-white'
                        : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                      'size-6 shrink-0',
                    ]"
                    aria-hidden="true"
                  />
                  {{ t(`admin.navigation.${item.id}`) }}
                </RouterLink>
              </li>
            </ul>
          </li>
          <li>
            <div
              class="text-xs/6 font-semibold text-gray-500 dark:text-gray-400"
            >
              Public pages
            </div>
            <ul role="list" class="-mx-2 mt-2 space-y-1">
              <li v-for="item in publicPages" :key="item.id">
                <RouterLink
                  v-if="item.enabled"
                  :to="{ name: item.routeName }"
                  class="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                >
                  <span
                    class="border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5"
                    >{{ item.initial }}</span
                  >
                  <span class="truncate">{{
                    t(`admin.navigation.${item.id}`)
                  }}</span>
                </RouterLink>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Settings Section -->
        <div
          v-for="item in bottomNavigation"
          :key="item.routeName"
          class="mb-3"
        >
          <RouterLink
            :to="{ name: item.routeName }"
            :class="[
              route.name === item.routeName
                ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold -mx-2',
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                route.name === item.routeName
                  ? 'text-indigo-600 dark:text-white'
                  : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                'size-6 shrink-0',
              ]"
              aria-hidden="true"
            />
            {{ t(`admin.navigation.${item.id}`) }}
          </RouterLink>
        </div>

        <!-- Separator -->
        <div class="-mx-6 mt-auto">
          <div class="border-t border-gray-200 dark:border-white/10"></div>
        </div>

        <!-- User Profile -->
        <div class="-mx-6">
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
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Admin
                </span>
              </div>
              <ChevronUpDownIcon
                class="size-5 text-gray-400"
                aria-hidden="true"
              />
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
                class="absolute bottom-full left-0 right-0 mb-2 mx-6 w-auto origin-bottom rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg outline-1 outline-black/5 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
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
      </nav>
    </div>
  </div>
</template>

<style scoped></style>
