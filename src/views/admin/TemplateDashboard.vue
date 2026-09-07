<template>
  <DashboardNavigation
    :sidebar-open="sidebarOpen"
    :top-navigation="navigation"
    :bottom-navigation="bottomNavigation"
    :public-pages="publicPages"
    :user="user"
    @close="sidebarOpen = false"
  />

  <!-- No inner scroll container: the document itself scrolls, so the sticky
       header actually sticks and useHideOnScroll sees the scroll events. -->
  <div
    class="lg:pl-72 dark:border-white/5 min-h-dvh flex flex-col pb-[var(--floating-action-clearance)]"
  >
    <div class="flex-1">
      <router-view />
    </div>
  </div>
  <!-- component -->
</template>

<script setup lang="ts">
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'
import DashboardNavigation from '@/components/navigation/DashboardNavigation.vue'
import { authService } from '@/features/auth/service.ts'
import { RouteNames } from '@/router/routeNames.ts'
import { useSettingsStore } from '@/features/settings/useSettings.store'
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

const settingsStore = useSettingsStore()

const userEmail = ref<string | null>(null)
const user = ref<User | null>(null)

const navigation = computed(() => [
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
    enabled: settingsStore.settings?.library?.enabled ?? false,
  },
  {
    id: 'events',
    routeName: RouteNames.admin.events,
    icon: CalendarDaysIcon,
    enabled: settingsStore.settings?.events?.enabled ?? false,
  },
  {
    id: 'tournaments',
    routeName: RouteNames.admin.tournaments as string,
    icon: IconTrophy,
    enabled: settingsStore.settings?.tournaments?.enabled ?? false,
  },
  {
    id: 'tickets',
    routeName: RouteNames.admin.tickets.root as string,
    icon: IconTicket,
    enabled: settingsStore.settings?.tickets?.enabled ?? false,
  },
  {
    id: 'orders',
    routeName: RouteNames.admin.ordersRoot,
    icon: IconShoppingBag,
    enabled: settingsStore.settings?.tickets?.enabled ?? false,
  },
  {
    id: 'check-in',
    routeName: RouteNames.admin.checkIn,
    icon: IconScanTraces,
    enabled: settingsStore.settings?.tickets?.enabled ?? false,
  },
])

const bottomNavigation = computed(() => [
  {
    id: 'settings',
    routeName: RouteNames.admin.settings,
    icon: IconSettings,
    enabled: user.value
      ? authService.hasAnyOfTheRoles(user.value, ['admin'])
      : false,
  },
])

const publicPages = computed(() => [
  {
    id: 'library',
    routeName: RouteNames.public.library,
    initial: 'L',
    enabled: settingsStore.settings?.library?.enabled ?? false,
  },
])

const sidebarOpen = ref(false)

// Load user email on component mount
onMounted(async () => {
  try {
    const userResponse = await authService.getUser()

    if (userResponse) {
      userEmail.value = userResponse.email || ''
      user.value = userResponse
    }
  } catch (error) {
    console.error('Error loading user email:', error)
  }
})
</script>
