<script setup lang="ts">
import { ref } from 'vue'
import { IconChartDots } from '@tabler/icons-vue'

import { useI18n } from 'vue-i18n'
import SecondaryNavigation from '@/components/navigation/SecondaryNavigation.vue'
import { RouteNames } from '@/router/routeNames.ts'

const { t } = useI18n()

const secondaryNavigation = ref([
  {
    name: t('admin.orders.navOverview'),
    routeName: RouteNames.admin.tickets.overview,
    icon: IconChartDots,
  },
])
</script>

<template>
  <SecondaryNavigation :items="secondaryNavigation" />

  <div class="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
    <router-view />
  </div>
</template>
