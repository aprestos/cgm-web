<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import PageHeader from '@/components/PageHeader.vue'
import SearchInput from '@/components/SearchInput.vue'
import orderService from '@/features/orders/service'
import { tenantStore } from '@/stores/tenant'
import logger from '@/lib/logger'
import { useI18n } from 'vue-i18n'
import OrdersDataTable from './OrdersDataTable.vue'
import DialogOrderDetails from './DialogOrderDetails.vue'
import type { RecentOrder } from '@/views/admin/orders/overview/orders.types.ts'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const selectedOrderId = ref<string | null>(null)
const detailsOpen = ref(false)

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
  if (!tenantStore.value?.id) return
  recentOrdersLoading.value = true
  try {
    recentOrders.value = await orderService.getOrders(
      tenantStore.value.id,
      emailSearch.value.trim() || undefined,
    )
  } catch (error) {
    logger.error('Failed to load recent orders', { error })
  } finally {
    recentOrdersLoading.value = false
  }
}

const onSearch = useDebounceFn((email: string) => {
  emailSearch.value = email
  void loadRecentOrders()
}, 300)

onMounted(() => void loadRecentOrders())
</script>

<template>
  <div class="p-4 gap-4 md:p-6 md:gap-6 flex flex-col">
    <PageHeader
      :title="t('admin.orders.list.title')"
      :description="t('admin.orders.list.description')"
      class="hidden lg:block"
    />

    <SearchInput
      :model-value="emailSearch"
      :placeholder="t('admin.orders.searchByUserIdPlaceholder')"
      @update:model-value="onSearch"
    />

    <OrdersDataTable
      :loading="recentOrdersLoading"
      :orders="recentOrders"
      @view-details="openDetails"
    />
  </div>

  <DialogOrderDetails
    :open="detailsOpen"
    :order-id="selectedOrderId"
    @close="closeDetails"
  />
</template>
