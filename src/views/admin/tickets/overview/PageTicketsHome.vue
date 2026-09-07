<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { IconTicket } from '@tabler/icons-vue'
import { useEditionStore } from '@/features/events/edition.store'
import ticketService from '@/features/tickets/service'
import type {
  Ticket,
  TicketDay,
  TicketGroup,
} from '@/features/tickets/ticket.model'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger.ts'
import { getTicketTitle } from '@/utils/ticket'
import { formatPrice } from '@/utils/price'
import PageHeader from '@/components/PageHeader.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ListDetailLayout from '@/components/ListDetailLayout.vue'
import DialogCreateTicket from '@/views/admin/tickets/DialogCreateTicket.vue'
import TicketDayLimits from '@/views/admin/tickets/overview/TicketDayLimits.vue'
import TicketListRow from '@/views/admin/tickets/overview/TicketListRow.vue'
import TicketDetailPanel from '@/views/admin/tickets/overview/TicketDetailPanel.vue'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const { t, locale } = useI18n()

// State
const tickets = ref<Ticket[]>([])
const days = ref<TicketDay[]>([])
const loading = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const shownDialog = ref<string>('')
// Pre-selected group for the create dialog
const preSelectedGroup = ref<TicketGroup | null>(null)
// Delete confirmation
const showDeleteConfirmation = ref(false)
const ticketToDelete = ref<Ticket | null>(null)
const isDeleting = ref(false)

const ticketLabel = (ticket: Ticket): string =>
  ticket.name ||
  getTicketTitle(ticket.accessDays, locale.value, t('landing.tickets.weekend'))
    .displayDate

// Actions
const handleSelect = (ticket: Ticket): void => {
  selectedTicket.value = ticket
}

const handleDelete = (ticket: Ticket): void => {
  ticketToDelete.value = ticket
  showDeleteConfirmation.value = true
}

const confirmDelete = async (): Promise<void> => {
  if (!ticketToDelete.value) return

  isDeleting.value = true
  try {
    await ticketService.delete(ticketToDelete.value.id)
    toast.success(t('admin.tickets.deleteSuccess'))
    if (selectedTicket.value?.id === ticketToDelete.value.id) {
      selectedTicket.value = null
    }
    await loadTickets()
    showDeleteConfirmation.value = false
    ticketToDelete.value = null
  } catch (error) {
    logger.error('Error deleting ticket:', {
      error,
      ticket: ticketToDelete.value,
    })
    toast.error(t('admin.tickets.deleteFailed'))
  } finally {
    isDeleting.value = false
  }
}

const cancelDelete = (): void => {
  showDeleteConfirmation.value = false
  ticketToDelete.value = null
}

const handleAdd = (): void => {
  preSelectedGroup.value = null
  shownDialog.value = 'add'
}

const handleTicketCreated = async (): Promise<void> => {
  await loadTickets()
}

const handleDialogClose = (): void => {
  shownDialog.value = ''
  preSelectedGroup.value = null
}

// Methods
async function loadTickets(): Promise<void> {
  if (!tenantStore.tenant?.id || !editionStore.edition?.id) {
    logger.warn('No edition selected')
    return
  }

  loading.value = true
  try {
    tickets.value = await ticketService.getAll(
      tenantStore.tenant.id,
      editionStore.edition.id,
    )
  } catch (error) {
    logger.error('Error loading tickets:', {
      error,
      editionId: editionStore.edition.id,
      tenantId: tenantStore.tenant.id,
    })
    toast.error(t('admin.tickets.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function loadCapacity(): Promise<void> {
  if (!tenantStore.tenant?.id || !editionStore.edition?.id) {
    logger.warn('No edition selected')
    return
  }

  loading.value = true
  try {
    days.value = await ticketService.getDays(
      tenantStore.tenant.id,
      editionStore.edition.id,
    )
  } catch (error) {
    logger.error('Error loading tickets:', {
      error,
      editionId: editionStore.edition.id,
      tenantId: tenantStore.tenant.id,
    })
    toast.error(t('admin.tickets.loadFailed'))
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadTickets(), loadCapacity()])
})
</script>

<template>
  <!-- Page Header -->
  <PageHeader
    :title="t('admin.tickets.title')"
    :description="t('admin.tickets.description')"
    :action-label="t('admin.tickets.button.add')"
    class="p-6 sm:p-0"
    @action="handleAdd"
  >
    <template #action-icon>
      <IconTicket class="size-5" stroke="2" />
    </template>
  </PageHeader>

  <!-- Daily people limits -->
  <TicketDayLimits :days="days" :loading="loading" />

  <!-- Tickets list/detail -->
  <ListDetailLayout
    :items="tickets"
    :selected-id="selectedTicket?.id ?? null"
    :loading="loading"
    @select="handleSelect"
  >
    <template #list-header>
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ t('admin.tickets.ticketTypesTitle') }}
      </h2>
    </template>

    <template #list-empty>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('admin.tickets.noTicketsYet') }}
      </p>
    </template>

    <template #tab="{ item, selected }">
      <span class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="
            item.status === 'active'
              ? 'bg-green-500'
              : 'bg-gray-300 dark:bg-gray-600'
          "
        />
        {{ ticketLabel(item) }}
      </span>
      <span
        class="mt-0.5 block text-xs font-normal"
        :class="
          selected
            ? 'text-primary-400 dark:text-primary-300'
            : 'text-gray-400 dark:text-gray-500'
        "
      >
        {{ item.accessDays?.length }} days - {{ formatPrice(item.price) }}
      </span>
    </template>

    <template #row="{ item, selected }">
      <TicketListRow :ticket="item" :selected="selected" />
    </template>

    <template #detail>
      <TicketDetailPanel :ticket="selectedTicket" @delete="handleDelete" />
    </template>
  </ListDetailLayout>

  <!-- Dialogs -->
  <DialogCreateTicket
    :open="shownDialog === 'add'"
    @close="handleDialogClose"
    @created="handleTicketCreated"
  />

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :open="showDeleteConfirmation"
    :title="t('admin.tickets.deleteConfirmTitle')"
    :confirm-text="t('common.actions.delete')"
    :cancel-text="t('common.actions.cancel')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @close="cancelDelete"
  >
    <p class="text-sm text-gray-600 dark:text-gray-300">
      {{ t('admin.tickets.deleteConfirmMessage') }}
    </p>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ t('admin.tickets.deleteConfirmWarning') }}
    </p>
  </ConfirmationDialog>
</template>

<style scoped></style>
