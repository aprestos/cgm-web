<template>
  <div>
    <header class="relative">
      <nav aria-label="Top" class="mx-auto max-w-7xl sm:px-6 lg:px-8 xl:px-0">
        <div
          class="border-b border-gray-200 dark:border-white/5 px-4 pb-14 sm:px-0 sm:pb-0"
        >
          <div class="flex h-16 items-center justify-between">
            <!-- Logo -->
            <div class="flex flex-1">
              <RouterLink :to="{ name: RouteNames.landing.home }">
                <span class="sr-only">{{
                  tenantStore?.name || 'Your Company'
                }}</span>
                <!-- Logo SkeletonLoader -->
                <SkeletonLoader
                  v-if="!tenantStore?.logos"
                  class="h-12 w-auto"
                />
                <!-- Actual Logo -->
                <img
                  v-else
                  class="h-12 w-auto"
                  :src="
                    getTenantLogo(LogoType.long) || '@/assets/logoipsum-381.svg'
                  "
                  :alt="tenantStore.name + ' logo'"
                />
              </RouterLink>
            </div>

            <!-- Flyout menus -->
            <PopoverGroup
              class="absolute inset-x-0 bottom-0 sm:static sm:flex-1 sm:self-stretch"
            >
              <div
                class="flex h-14 space-x-8 overflow-x-auto border-t border-gray-200 dark:border-white/5 px-4 pb-px sm:h-full sm:justify-center sm:overflow-visible sm:border-t-0 sm:pb-0"
              >
                <RouterLink
                  v-for="page in navigation"
                  :key="page.name"
                  :to="page.href"
                  class="text-nowrap flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  {{ page.name }}
                </RouterLink>
              </div>
            </PopoverGroup>

            <div class="flex flex-1 items-center justify-end space-x-4">
              <LanguageSwitcher />
              <!-- Show authenticated user elements -->
              <template v-if="isAuthenticated">
                <!-- Admin Panel Button (only show if user is staff or admin) -->
                <RouterLink
                  v-if="isStaffOrAdmin"
                  :to="{ name: RouteNames.admin.library }"
                  class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <IconSettings class="h-4 w-4" aria-hidden="true" />
                  {{ t('navigation.admin') }}
                </RouterLink>

                <!-- Separator (only show if admin button is visible) -->
                <div
                  v-if="isStaffOrAdmin"
                  class="h-6 w-px bg-gray-300 dark:bg-gray-600"
                ></div>

                <!-- Profile Dropdown -->
                <Menu as="div" class="relative">
                  <MenuButton
                    class="flex cursor-pointer items-center rounded-full hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
                  >
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold"
                    >
                      {{ user?.name ? user.name[0] : 'U' }}
                    </div>
                  </MenuButton>

                  <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="transform opacity-0 scale-95"
                    enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75"
                    leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95"
                  >
                    <MenuItems
                      class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/10 ring-opacity-5 focus:outline-none"
                    >
                      <MenuItem v-slot="{ active }">
                        <RouterLink
                          :to="{
                            name: RouteNames.public.user,
                            params: { id: user?.id },
                          }"
                        >
                          <button
                            :class="[
                              active ? 'bg-gray-100 dark:bg-gray-700' : '',
                              'cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                            ]"
                          >
                            <IconUser class="h-4 w-4" aria-hidden="true" />
                            {{ t('navigation.profile') }}
                          </button>
                        </RouterLink>
                      </MenuItem>
                      <MenuItem v-slot="{ active }" class="cursor-pointer">
                        <button
                          :class="[
                            active ? 'bg-gray-100 dark:bg-gray-700' : '',
                            'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                          ]"
                          @click="handleSignOut"
                        >
                          <IconLogout class="h-4 w-4" aria-hidden="true" />
                          {{ t('auth.signOut') }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Menu>
              </template>

              <!-- Show sign in button when not authenticated -->
              <RouterLink
                v-else
                :to="{
                  name: RouteNames.auth.signIn,
                  query: { redirect: $route.fullPath },
                }"
                class="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                {{ t('auth.signIn') }}
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  </div>
</template>

<script setup lang="ts">
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  PopoverGroup,
} from '@headlessui/vue'
import { IconSettings, IconUser, IconLogout } from '@tabler/icons-vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { authService } from '@/features/auth/service.ts'
import { getTenantLogo, tenantStore } from '@/stores/tenant.ts'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { RouteNames } from '@/router/routeNames'
import type { User } from '@/features/auth/user.model.ts'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { LogoType } from '@/features/tenant/tenant.model.ts'

const { t } = useI18n()
const user = ref<User | null>(null)
const isStaffOrAdmin = ref(false)
const isAuthenticated = ref(false)

// Load user email and check admin role on component mount
onMounted(async () => {
  try {
    user.value = await authService.getUser()
    if (user.value) {
      isAuthenticated.value = true

      // Check if user has staff or admin role
      isStaffOrAdmin.value = authService.hasAnyOfTheRoles(user.value, [
        'staff',
        'admin',
      ])
    } else {
      isAuthenticated.value = false
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    isAuthenticated.value = false
  }
})

const handleSignOut = async (): Promise<void> => {
  try {
    await authService.signOut()
    // Reset authentication state
    isAuthenticated.value = false
    isStaffOrAdmin.value = false
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

interface Category {
  name: string
}

interface NavigationItem {
  name: string
  href: string
  current: boolean
  categories: Category[]
}

const navigation = ref<NavigationItem[]>([
  {
    name: t('navigation.library'),
    href: '/library',
    current: true,
    categories: [{ name: 'Popular' }, { name: 'New' }, { name: 'All' }],
  },
])
</script>
