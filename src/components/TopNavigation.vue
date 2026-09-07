<template>
  <header
    class="sticky top-0 z-40 bg-white dark:bg-gray-950 transition-transform duration-300 motion-reduce:transition-none"
    :class="isHidden ? '-translate-y-full' : 'translate-y-0'"
  >
    <nav aria-label="Top" class="mx-auto max-w-7xl sm:px-6 lg:px-8 xl:px-0">
      <div
        class="border-b border-gray-200 dark:border-white/5 px-4 pb-14 sm:px-0 sm:pb-0"
      >
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <div class="flex flex-1">
            <RouterLink :to="{ name: RouteNames.landing.home }">
              <span class="sr-only">{{
                tenantStore.tenant?.name || 'Your Company'
              }}</span>
              <!-- Logo SkeletonLoader -->
              <SkeletonLoader
                v-if="!tenantStore.getLogo(LogoType.long)"
                class="h-12 w-auto"
              />
              <!-- Actual Logo -->
              <img
                v-else
                class="h-12 w-auto"
                :src="
                  tenantStore.getLogo(LogoType.long) ||
                  '@/assets/logoipsum-381.svg'
                "
                :alt="tenantStore.tenant?.name + ' logo'"
              />
            </RouterLink>
          </div>

          <PopoverGroup
            class="absolute inset-x-0 bottom-0 sm:static sm:flex-1 sm:self-stretch"
          >
            <div
              class="flex h-14 space-x-8 overflow-x-auto px-4 pb-px sm:h-full sm:justify-center sm:overflow-visible sm:border-t-0 sm:pb-0"
            >
              <RouterLink
                v-for="page in enabledNavigation"
                :key="page.route"
                :to="{ name: page.route }"
                class="text-nowrap flex items-center -mb-px border-b-2 text-sm font-semibold transition-colors"
                :class="
                  isActive(page.route)
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                "
              >
                {{ t(page.name) }}
              </RouterLink>
            </div>
          </PopoverGroup>

          <div class="flex flex-1 items-center justify-end space-x-4">
            <LanguageSwitcher />
            <!-- Show authenticated user elements -->
            <template v-if="isAuthenticated">
              <!-- Profile Dropdown -->
              <Menu as="div" class="relative">
                <MenuButton
                  class="flex cursor-pointer items-center rounded-full hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
                >
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold"
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
                    class="absolute right-0 z-10 mt-2 w-[min(16rem,calc(100vw-2rem))] origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/10 ring-opacity-5 focus:outline-none overflow-hidden"
                  >
                    <!-- Account details header -->
                    <div
                      class="px-4 py-3 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold"
                        >
                          {{ user?.name ? user.name[0].toUpperCase() : 'U' }}
                        </div>
                        <div class="min-w-0">
                          <p
                            class="text-sm font-semibold text-gray-900 dark:text-white truncate"
                          >
                            {{ user?.name }}
                          </p>
                          <p
                            class="text-xs text-gray-500 dark:text-gray-400 truncate"
                          >
                            {{ user?.email }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Menu items -->
                    <div class="py-1">
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
                            {{ t('public.navigation.profile') }}
                          </button>
                        </RouterLink>
                      </MenuItem>

                      <!-- Admin Panel (only show if user is staff or admin) -->
                      <MenuItem v-if="isStaffOrAdmin" v-slot="{ active }">
                        <RouterLink :to="{ name: RouteNames.admin.library }">
                          <button
                            :class="[
                              active ? 'bg-gray-100 dark:bg-gray-700' : '',
                              'cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                            ]"
                          >
                            <IconSettings class="h-4 w-4" aria-hidden="true" />
                            {{ t('public.navigation.admin') }}
                          </button>
                        </RouterLink>
                      </MenuItem>
                    </div>

                    <!-- Sign out -->
                    <div
                      class="border-t border-gray-100 dark:border-gray-700 py-1"
                    >
                      <MenuItem v-slot="{ active }">
                        <button
                          :class="[
                            active
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : 'text-gray-700 dark:text-gray-300',
                            'flex items-center gap-2 w-full text-left px-4 py-2 text-sm',
                          ]"
                          @click="handleSignOut"
                        >
                          <IconLogout class="h-4 w-4" aria-hidden="true" />
                          {{ t('auth.signOut') }}
                        </button>
                      </MenuItem>
                    </div>
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
              class="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              {{ t('auth.signIn') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  PopoverGroup,
} from '@headlessui/vue'
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { authService } from '@/features/auth/service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { RouteNames } from '@/router/routeNames'
import type { User } from '@/features/auth/user.model.ts'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { useSettingsStore } from '@/features/settings/useSettings.store'
import { useRoute } from 'vue-router'
import { useHideOnScroll } from '@/composables/useHideOnScroll'

const tenantStore = useTenantStore()
const settingsStore = useSettingsStore()

const { t } = useI18n()

// Slide the header out of the way on the way down, bring it back on the way up.
const isHidden = useHideOnScroll()

const user = ref<User | null>(null)
const isStaffOrAdmin = ref(false)
const isAuthenticated = ref(false)

const route = useRoute()

const isActive = (routeName: string): boolean => {
  return route.matched.some((r) => r.name === routeName)
}

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

interface NavigationItem {
  name: string
  route: string
  enabled: boolean
}

const navigation = ref<NavigationItem[]>([
  {
    name: 'public.navigation.library',
    route: RouteNames.public.library,
    enabled: settingsStore.settings?.library?.enabled ?? false,
  },
  {
    name: 'public.navigation.tournaments',
    route: RouteNames.public.tournaments,
    enabled: settingsStore.settings?.tournaments?.enabled ?? false,
  },
])

const enabledNavigation = computed(() => {
  return (navigation?.value ?? []).filter((item) => item.enabled)
})
</script>
