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
import DialogCreateOrder from './DialogCreateOrder.vue'

const { t } = useI18n()

const createOrderOpen = ref(false)

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

  <div class="flex flex-col">
    <router-view />
  </div>

  <SettingsBottomBar>
    <CButton size="xl" @click="createOrderOpen = true">
      <template #icon-left>
        <IconShoppingBagPlus class="h-5 w-5" />
      </template>
      {{ t('admin.orders.newOrder') }}
    </CButton>
  </SettingsBottomBar>

  <DialogCreateOrder
    :open="createOrderOpen"
    @close="createOrderOpen = false"
    @created="createOrderOpen = false"
  />
</template>
