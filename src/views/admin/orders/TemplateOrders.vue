<script setup lang="ts">
import { ref } from 'vue'
import {
  IconChartDots,
  IconDatabase,
  IconShoppingBagPlus,
} from '@tabler/icons-vue'

import { useI18n } from 'vue-i18n'
import SecondaryNavigation from '@/components/navigation/SecondaryNavigation.vue'
import { RouteNames } from '@/router/routeNames.ts'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import CButton from '@/components/CButton.vue'

const { t } = useI18n()

const secondaryNavigation = ref([
  {
    name: t('admin.orders.navOverview'),
    routeName: RouteNames.admin.orders.overview,
    icon: IconChartDots,
  },
  {
    name: t('admin.orders.navDetails'),
    label: t('admin.orders.navDetails'),
    routeName: RouteNames.admin.orders.details,
    icon: IconDatabase,
  },
])
</script>

<template>
  <SecondaryNavigation :items="secondaryNavigation" />

  <div class="flex flex-col">
    <router-view />
  </div>
  <SettingsBottomBar>
    <CButton class="hidden" size="xl">
      <slot name="action-icon" />
      <IconShoppingBagPlus /> {{ t('admin.orders.newOrder') }}
    </CButton>
  </SettingsBottomBar>
</template>
