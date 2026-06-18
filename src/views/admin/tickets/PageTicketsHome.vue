<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  IconCalendar,
  IconChevronDown,
  IconCurrencyEuro,
  IconPlus,
  IconTicket,
  IconUsers,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { editionStore } from '@/stores/edition'
import ticketService from '@/features/tickets/service'
import { type Ticket, TicketGroup } from '@/features/tickets/ticket.model'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'
import CButton from '@/components/CButton.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatisticCard from '@/components/StatisticCard.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import DialogCreateTicket from '@/views/admin/tickets/DialogCreateTicket.vue'
import TicketGroupTable from '@/views/admin/tickets/TicketGroupTable.vue'
import { formatPrice } from '@/utils/price.ts'
import BaseCard from '@/components/BaseCard.vue'

const { t } = useI18n()

// State
const tickets = ref<Ticket[]>([])
const loading = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const shownDialog = ref<string>('')
// Pre-selected group for the create dialog
const preSelectedGroup = ref<TicketGroup | null>(null)
// Delete confirmation
const showDeleteConfirmation = ref(false)
const ticketToDelete = ref<Ticket | null>(null)
const isDeleting = ref(false)

// Computed - Statistics
const statistics = computed(() => {
  const total = tickets.value.length
  const active = tickets.value.filter((t) => t.active === true).length
  const totalRevenue = tickets.value.reduce(
    (sum, t) => sum + t.price * (t.quantity || 0),
    0,
  )
  const totalQuantity = tickets.value.reduce(
    (sum, t) => sum + (t.quantity || 0),
    0,
  )

  return {
    total,
    active,
    inactive: tickets.value.filter((t) => t.active === false).length,
    soldOut: 0,
    totalRevenue,
    totalQuantity,
  }
})

// Computed - Group tickets by TicketGroup
const ticketsByGroup = computed(() => {
  const grouped: Record<TicketGroup, Ticket[]> = {
    [TicketGroup.GENERAL]: [],
    [TicketGroup.ADMIN]: [],
  }

  tickets.value.forEach((ticket) => {
    if (ticket.group in grouped) {
      grouped[ticket.group].push(ticket)
    } else {
      logger.warn(
        `[ticketsByGroup] Unexpected ticket group: "${ticket.group}" for ticket:`,
        ticket,
      )
    }
  })

  return grouped
})

// Helper functions
const getGroupName = (group: TicketGroup): string => {
  const names: Record<TicketGroup, string> = {
    [TicketGroup.GENERAL]: t('admin.tickets.general'),
    [TicketGroup.ADMIN]: t('admin.tickets.admin'),
  }
  return names[group]
}

// Actions
const handleEdit = (ticket: Ticket): void => {
  selectedTicket.value = ticket
  shownDialog.value = 'edit'
  toast.info(t('admin.tickets.editFunctionalityComingSoon'))
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

const handleView = (ticket: Ticket): void => {
  selectedTicket.value = ticket
  shownDialog.value = 'view'
  toast.info(t('admin.tickets.viewDetailsFunctionalityComingSoon'))
}

const handleAdd = (): void => {
  preSelectedGroup.value = null
  shownDialog.value = 'add'
}

const handleAddForGroup = (group: TicketGroup): void => {
  preSelectedGroup.value = group
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
  if (!tenantStore.value?.id || !editionStore.value?.id) {
    logger.warn('No edition selected')
    return
  }

  loading.value = true
  try {
    tickets.value = await ticketService.get(
      tenantStore.value.id,
      editionStore.value.id,
    )
  } catch (error) {
    logger.error('Error loading tickets:', {
      error,
      editionId: editionStore.value.id,
      tenantId: tenantStore.value.id,
    })
    toast.error(t('admin.tickets.loadFailed'))
  } finally {
    loading.value = false
  }
}

const groups = computed(() => {
  return Object.values(TicketGroup)
})

// Lifecycle
onMounted(async () => {
  await loadTickets()
})
</script>

<template>
  <div class="flex flex-col space-y-6 p-0 sm:p-6">
    <!-- Page Header -->
    <PageHeader
      :title="t('admin.tickets.title')"
      :description="t('admin.tickets.description')"
      class="p-6 sm:p-0 hidden lg:block"
      @action="handleAdd"
    >
    </PageHeader>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
      <StatisticCard
        :label="t('admin.tickets.totalTickets')"
        :value="statistics.total"
        :icon="IconTicket"
        :loading="loading"
        color="fuchsia"
        :subtitle="`${t('admin.tickets.active')}: ${statistics.active} • ${t('admin.tickets.inactive')}: ${statistics.inactive}`"
      />

      <StatisticCard
        :label="t('admin.tickets.revenuePotential')"
        :value="formatPrice(statistics.totalRevenue)"
        :icon="IconCurrencyEuro"
        :loading="loading"
        color="green"
        :subtitle="t('admin.tickets.basedOnQuantityPrice')"
      />

      <StatisticCard
        :label="t('admin.tickets.totalCapacity')"
        :value="statistics.totalQuantity"
        :icon="IconUsers"
        :loading="loading"
        color="purple"
        :subtitle="t('admin.tickets.totalAvailableSlots')"
      />

      <StatisticCard
        :label="t('admin.tickets.activeStatus')"
        :value="statistics.active"
        :icon="IconCalendar"
        :loading="loading"
        color="emerald"
        :subtitle="t('admin.tickets.currentlyOnSale')"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
        role="status"
        aria-label="Loading tickets"
      >
        <span class="sr-only">{{ t('common.loading') }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <BaseCard
      v-else-if="tickets.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700"
    >
      <IconTicket class="mx-auto h-16 w-16 text-gray-400" stroke="1.5" />
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('admin.tickets.noTicketsYet') }}
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ t('admin.tickets.getStartedCreating') }}
      </p>
      <CButton variant="primary" class="mt-6" @click="handleAdd">
        <template #icon-left>
          <IconPlus class="size-4" />
        </template>
        {{ t('admin.tickets.createFirstTicket') }}
      </CButton>
    </BaseCard>

    <!-- Tickets Table by Group -->
    <div v-else class="space-y-6">
      <Disclosure
        v-for="group in groups"
        :key="group"
        v-slot="{ open }"
        as="div"
        default-open
        class="bg-white dark:bg-gray-800 sm:rounded-xl shadow-sm sm:border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Group Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <DisclosureButton
                class="flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <IconChevronDown
                  class="size-5 cursor-pointer transition-transform duration-200"
                  :class="{ 'rotate-180': open }"
                />
              </DisclosureButton>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ getGroupName(group) }}
                <span
                  class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                  ({{ ticketsByGroup[group].length }})
                </span>
              </h2>
            </div>
            <CButton
              variant="transparent"
              size="sm"
              @click="handleAddForGroup(group)"
            >
              <template #icon-left>
                <IconPlus class="size-4" />
              </template>
              {{ t('admin.tickets.addTicket') }}
            </CButton>
          </div>
        </div>

        <!-- Ticket Group Table (Collapsible) -->
        <DisclosurePanel>
          <TicketGroupTable
            :tickets="ticketsByGroup[group]"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </DisclosurePanel>
      </Disclosure>
    </div>
  </div>

  <!-- Dialogs -->
  <DialogCreateTicket
    :open="shownDialog === 'add'"
    :group="preSelectedGroup || TicketGroup.GENERAL"
    @close="handleDialogClose"
    @created="handleTicketCreated"
  />

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :open="showDeleteConfirmation"
    :title="t('admin.tickets.deleteConfirmTitle')"
    :confirm-text="t('common.delete')"
    :cancel-text="t('common.cancel')"
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
