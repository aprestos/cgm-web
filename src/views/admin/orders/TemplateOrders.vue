<script setup lang="ts">
import { ref } from 'vue'
import { IconChartDots, IconDatabase } from '@tabler/icons-vue'

import { useI18n } from 'vue-i18n'
import SecondaryNavigation from '@/components/navigation/SecondaryNavigation.vue'
import { RouteNames } from '@/router/routeNames.ts'

const { t } = useI18n()

const secondaryNavigation = ref([
  {
    name: t('admin.orders.navOverview'),
    routeName: RouteNames.admin.orders.overview,
    icon: IconChartDots,
  },
  {
    name: t('admin.orders.navDetails'),
    routeName: RouteNames.admin.orders.details,
    icon: IconDatabase,
  },
])
</script>

<template>
  <SecondaryNavigation :items="secondaryNavigation" />

  <div class="p-4 gap-4 md:p-6 md:gap-6 flex flex-col">
    <router-view />
  </div>
</template>
