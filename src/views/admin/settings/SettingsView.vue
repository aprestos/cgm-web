<template>
  <h1 class="sr-only">Settings</h1>

  <SecondaryNavigation :items="secondaryNavigation" />

  <!-- Settings forms -->
  <div class="divide-y divide-gray-200 dark:divide-white/10">
    <RouterView :key="route.fullPath" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  IconApps,
  IconBooks,
  IconBuilding,
  IconCalendar,
  IconSettings,
} from '@tabler/icons-vue'
import { RouteNames } from '@/router/routeNames'
import SecondaryNavigation, {
  type SecondaryNavigationItem,
} from '@/components/navigation/SecondaryNavigation.vue'

const route = useRoute()

const secondaryNavigation: SecondaryNavigationItem[] = [
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
</script>
