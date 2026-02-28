<template>
  <h1 class="sr-only">Settings</h1>

  <header class="border-b border-gray-200 dark:border-white/5">
    <!-- Secondary navigation -->
    <nav class="flex overflow-x-auto py-4">
      <ul
        role="list"
        class="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8 dark:text-gray-400"
      >
        <li v-for="item in secondaryNavigation" :key="item.name">
          <a
            href="#"
            :class="[
              route.name === item.routeName
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'hover:text-gray-700 dark:hover:text-gray-300',
            ]"
            @click.prevent="handleNavigation(item.routeName)"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="inline-block h-5 w-5 mr-2 -mt-0.5"
              aria-hidden="true"
            />
            {{ item.name }}
          </a>
        </li>
      </ul>
    </nav>
  </header>

  <!-- Settings forms -->
  <div class="divide-y divide-gray-200 dark:divide-white/10">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  IconBuilding,
  IconCalendar,
  IconApps,
  IconBooks,
  IconSettings,
} from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames'

const route = useRoute()
const router = useRouter()

const secondaryNavigation = [
  {
    name: 'Organization',
    routeName: RouteNames.admin.settingsOrganization,
    icon: IconBuilding,
  },
  {
    name: 'Edition',
    routeName: RouteNames.admin.settingsEdition,
    icon: IconCalendar,
  },
  {
    name: 'Features',
    routeName: RouteNames.admin.settingsFeatures,
    icon: IconApps,
  },
  {
    name: 'Library',
    routeName: RouteNames.admin.settingsLibrary,
    icon: IconBooks,
  },
  {
    name: 'Advanced',
    routeName: RouteNames.admin.settingsAdvanced,
    icon: IconSettings,
  },
]

// Handle navigation between tabs
const handleNavigation = (routeName: string): void => {
  // If already on this route, do nothing
  if (route.name === routeName) {
    return
  }

  // Navigate directly
  void router.push({ name: routeName })
}
</script>
