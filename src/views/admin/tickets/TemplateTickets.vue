<script setup lang="ts">
import { ref } from 'vue'
import { IconChartDots, IconTicket } from '@tabler/icons-vue'

import { useI18n } from 'vue-i18n'
import SecondaryNavigation from '@/components/navigation/SecondaryNavigation.vue'
import { RouteNames } from '@/router/routeNames.ts'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import CButton from '@/components/CButton.vue'
import DialogCreateTicket from '@/views/admin/tickets/DialogCreateTicket.vue'

const { t } = useI18n()

const createTicketDialogOpen = ref(false)

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

  <SettingsBottomBar>
    <CButton size="xl" @click="createTicketDialogOpen = true">
      <template #icon-left>
        <IconTicket class="h-5 w-5" />
      </template>
      {{ t('admin.tickets.button.add') }}
    </CButton>
  </SettingsBottomBar>
  <DialogCreateTicket
    :open="createTicketDialogOpen"
    @close="createTicketDialogOpen = false"
  />
</template>
