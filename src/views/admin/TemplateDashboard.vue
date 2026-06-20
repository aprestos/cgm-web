<template>
  <DashboardNavigation
    :sidebar-open="sidebarOpen"
    :top-navigation="navigation"
    :bottom-navigation="bottomNavigation"
    :public-pages="publicPages"
    :user="user"
    @close="sidebarOpen = false"
  />

  <div class="lg:pl-72 dark:border-white/5 min-h-screen flex flex-col">
    <div class="flex-1 overflow-auto min-h-0 p-0">
      <router-view />
    </div>
  </div>
  <!-- component -->
</template>

<script setup lang="ts">
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { onMounted, ref } from 'vue'
import DashboardNavigation from '@/components/navigation/DashboardNavigation.vue'
import { authService } from '@/features/auth/service.ts'
import { RouteNames } from '@/router/routeNames.ts'
import { settingsStore } from '@/features/settings/useSettings.store.ts'
import {
  IconBooks,
  IconHome,
  IconScanTraces,
  IconSettings,
  IconShoppingBag,
  IconTicket,
  IconTrophy,
} from '@tabler/icons-vue'
import type { User } from '@/features/auth/user.model.ts'

const userEmail = ref<string | null>(null)
const user = ref<User | null>(null)

const navigation = ref([
  {
    id: 'dashboard',
    routeName: RouteNames.admin.dashboard,
    icon: IconHome,
    enabled: false,
  },
  {
    id: 'library',
    routeName: RouteNames.admin.library,
    icon: IconBooks,
    enabled: settingsStore?.value?.library?.enabled ?? false,
  },
  {
    id: 'events',
    routeName: RouteNames.admin.events,
    icon: CalendarDaysIcon,
    enabled: settingsStore?.value?.events?.enabled ?? false,
  },
  {
    id: 'tournaments',
    routeName: RouteNames.admin.tournaments as string,
    icon: IconTrophy,
    enabled: settingsStore?.value?.tournaments?.enabled ?? false,
  },
  {
    id: 'tickets',
    routeName: RouteNames.admin.tickets as string,
    icon: IconTicket,
    enabled: settingsStore?.value?.tickets?.enabled ?? false,
  },
  {
    id: 'orders',
    routeName: RouteNames.admin.ordersRoot,
    icon: IconShoppingBag,
    enabled: settingsStore?.value?.tickets?.enabled ?? false,
  },
  {
    id: 'check-in',
    routeName: RouteNames.admin.checkIn,
    icon: IconScanTraces,
    enabled: settingsStore?.value?.tickets?.enabled ?? false,
  },
])

const bottomNavigation = ref([
  {
    id: 'settings',
    routeName: RouteNames.admin.settings,
    icon: IconSettings,
    enabled: false, // Will be set in onMounted
  },
])

const publicPages = [
  {
    id: 'library',
    routeName: RouteNames.public.library,
    initial: 'L',
    enabled: settingsStore?.value?.library?.enabled ?? false,
  },
]

const sidebarOpen = ref(false)

// Load user email on component mount
onMounted(async () => {
  try {
    const userResponse = await authService.getUser()

    if (userResponse) {
      userEmail.value = userResponse.email || ''
      user.value = userResponse

      // Set bottom navigation enabled state based on user role
      if (bottomNavigation.value[0]) {
        bottomNavigation.value[0].enabled = authService.hasAnyOfTheRoles(
          userResponse,
          ['admin'],
        )
      }
    }
  } catch (error) {
    console.error('Error loading user email:', error)
  }
})
</script>
