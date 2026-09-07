<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconShoppingBagPlus } from '@tabler/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import CSearchInput from '@/components/CSearchInput.vue'
import orderService from '@/features/orders/service'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger'
import { useI18n } from 'vue-i18n'
import OrdersDataTable from './OrdersDataTable.vue'
import DialogOrderDetails from './DialogOrderDetails.vue'
import DialogCreateOrder from '../DialogCreateOrder.vue'
import type { RecentOrder } from '@/views/admin/orders/overview/orders.types.ts'

const tenantStore = useTenantStore()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const selectedOrderId = ref<string | null>(null)
const detailsOpen = ref(false)
const createOrderOpen = ref(false)

watch(
  () => route.query.order,
  (orderId) => {
    if (typeof orderId === 'string' && orderId) {
      selectedOrderId.value = orderId
      detailsOpen.value = true
    } else {
      detailsOpen.value = false
      selectedOrderId.value = null
    }
  },
  { immediate: true },
)

function openDetails(orderId: string): void {
  void router.push({ query: { ...route.query, order: orderId } })
}

function closeDetails(): void {
  void router.push({ query: { ...route.query, order: undefined } })
}

const recentOrdersLoading = ref(false)
const recentOrders = ref<RecentOrder[]>([])
const emailSearch = ref('')

async function loadRecentOrders(): Promise<void> {
  if (!tenantStore.tenant?.id) return
  recentOrdersLoading.value = true
  try {
    recentOrders.value = await orderService.getOrders(
      tenantStore.tenant.id,
      emailSearch.value.trim() || undefined,
    )
  } catch (error) {
    logger.error('Failed to load recent orders', { error })
  } finally {
    recentOrdersLoading.value = false
  }
}

// Debounce lives on CSearchInput (300ms by default).
const onSearch = (email: string): void => {
  emailSearch.value = email
  void loadRecentOrders()
}

onMounted(() => void loadRecentOrders())
</script>

<template>
  <PageHeader
    :title="t('admin.orders.list.title')"
    :description="t('admin.orders.list.description')"
    :action-label="t('admin.orders.newOrder')"
    @action="createOrderOpen = true"
  >
    <template #action-icon>
      <IconShoppingBagPlus class="size-5" stroke="2" />
    </template>
  </PageHeader>

  <CSearchInput
    :model-value="emailSearch"
    :placeholder="t('admin.orders.searchByUserIdPlaceholder')"
    @update:model-value="onSearch"
  />

  <OrdersDataTable
    :loading="recentOrdersLoading"
    :orders="recentOrders"
    @view-details="openDetails"
  />

  <DialogOrderDetails
    :open="detailsOpen"
    :order-id="selectedOrderId"
    @close="closeDetails"
  />

  <DialogCreateOrder
    :open="createOrderOpen"
    @close="createOrderOpen = false"
    @created="createOrderOpen = false"
  />
</template>
