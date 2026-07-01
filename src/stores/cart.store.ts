import { ref, computed, type ComputedRef } from 'vue'
import { useStorage } from '@vueuse/core'
import type { Ticket } from '@/features/tickets/ticket.model'
import { cartService } from '@/features/cart/service.ts'
import { supabase } from '@/lib/supabase.ts'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'
import { ticketService } from '@/features/tickets/service.ts'

const LOCAL_STORAGE_KEY = 'congremio:cart:v1'
const SYNC_DEBOUNCE_MS = 500
const SYNC_RETRY_DELAYS_MS = [1000, 2000, 5000] as const

type CartSyncStatus = 'idle' | 'saving' | 'saved' | 'error'

interface PersistedCartItem {
  ticket: Ticket
  quantity: number
}

interface PersistedCart {
  cartId: string | null
  items: PersistedCartItem[]
}

export interface CartItem {
  ticket: Ticket
  quantity: number
}

const persistedCart = useStorage<PersistedCart | null>(LOCAL_STORAGE_KEY, null)

const items = ref<CartItem[]>([])
const cartId = ref<string | null>(null)
const syncStatus = ref<CartSyncStatus>('idle')
const lastSyncError = ref<string | null>(null)

let isHydrating = false
let isInitialized = false
let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null
let flushPromise: Promise<void> | null = null

interface UseCartReturn {
  cartItems: ComputedRef<CartItem[]>
  totalItems: ComputedRef<number>
  totalPrice: ComputedRef<number>
  cartSyncStatus: ComputedRef<CartSyncStatus>
  cartSyncError: ComputedRef<string | null>
  getQuantity: (ticketId: number) => number
  addToCart: (ticket: Ticket) => void
  removeFromCart: (ticketId: number) => void
  increaseQuantity: (ticketId: number) => void
  decreaseQuantity: (ticketId: number) => void
  clearCart: () => void
  flushSync: () => Promise<void>
}

function persistLocally(): void {
  persistedCart.value = {
    cartId: cartId.value,
    items: items.value,
  }
}

function loadLocalCart(): void {
  const saved = persistedCart.value
  if (!saved) {
    return
  }
  cartId.value = saved.cartId
  items.value = saved.items
}

/**
 * Resolves tenant and authenticated owner identifiers required for remote sync.
 * Returns null when sync context is not available yet.
 */
async function resolveTenantAndOwner(): Promise<{
  tenantId: string
  ownerId: string
} | null> {
  const tenantId = tenantStore.value?.id
  if (!tenantId) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.id) {
    return null
  }

  return {
    tenantId,
    ownerId: data.user.id,
  }
}

/**
 * Queues a debounced background synchronization after local optimistic mutations.
 */
function queueSync(): void {
  if (isHydrating) {
    return
  }

  persistLocally()

  if (pendingSyncTimer) {
    clearTimeout(pendingSyncTimer)
  }

  pendingSyncTimer = setTimeout(() => {
    void flushSync()
  }, SYNC_DEBOUNCE_MS)
}

/**
 * Saves the current cart snapshot to the backend using a single batched write.
 */
async function saveSnapshot(): Promise<void> {
  const context = await resolveTenantAndOwner()
  if (!context) {
    return
  }

  const remoteCart = await cartService.getOrCreate(
    context.tenantId,
    context.ownerId,
  )

  cartId.value = remoteCart.id

  await cartService.saveItems({
    tenantId: context.tenantId,
    cartId: remoteCart.id,
    items: items.value.map((item) => ({
      ticketId: item.ticket.id,
      quantity: item.quantity,
    })),
  })

  persistLocally()
}

/**
 * Flushes pending cart changes to the backend with retry/backoff.
 * This is used both by debounce and explicit lifecycle/checkout flushes.
 */
async function flushSync(): Promise<void> {
  if (flushPromise) {
    return flushPromise
  }

  if (pendingSyncTimer) {
    clearTimeout(pendingSyncTimer)
    pendingSyncTimer = null
  }

  flushPromise = (async (): Promise<void> => {
    syncStatus.value = 'saving'
    lastSyncError.value = null

    try {
      await saveSnapshot()
      syncStatus.value = 'saved'
      return
    } catch (initialError) {
      for (const delay of SYNC_RETRY_DELAYS_MS) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        try {
          await saveSnapshot()
          syncStatus.value = 'saved'
          return
        } catch {
          // Keep retrying with backoff.
        }
      }

      syncStatus.value = 'error'
      lastSyncError.value = 'Unable to sync cart changes right now.'
      logger.error('Cart sync failed after retries', {
        error: initialError,
      })
    }
  })()

  try {
    await flushPromise
  } finally {
    flushPromise = null
  }
}

/**
 * Hydrates cart items from the backend when local state is empty.
 * Local data takes precedence to preserve in-progress user actions.
 */
async function hydrateFromRemote(): Promise<void> {
  const context = await resolveTenantAndOwner()
  if (!context) {
    return
  }

  const remoteCart = await cartService.getOrCreate(
    context.tenantId,
    context.ownerId,
  )

  cartId.value = remoteCart.id

  if (items.value.length > 0 || remoteCart.items.length === 0) {
    persistLocally()
    return
  }

  const loadedItems = await Promise.all(
    remoteCart.items.map(async (item): Promise<CartItem | null> => {
      const ticket = await ticketService.getById(item.ticketId)
      if (!ticket) {
        return null
      }

      return {
        ticket,
        quantity: item.quantity,
      }
    }),
  )

  items.value = loadedItems.filter((item): item is CartItem => item !== null)
  persistLocally()
}

/**
 * Installs best-effort flush hooks for tab hide and page unload events.
 */
function installLifecycleSync(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('beforeunload', () => {
    void flushSync()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushSync()
    }
  })
}

/**
 * Performs one-time cart store bootstrap:
 * - load local snapshot
 * - install lifecycle hooks
 * - try remote hydration
 */
function initializeCartStore(): void {
  if (isInitialized) {
    return
  }

  isInitialized = true
  isHydrating = true

  loadLocalCart()
  installLifecycleSync()

  void (async (): Promise<void> => {
    try {
      await hydrateFromRemote()
      syncStatus.value = 'idle'
    } catch (error) {
      logger.warn('Unable to hydrate cart from remote, using local cart only', {
        error,
      })
    } finally {
      isHydrating = false
    }
  })()
}

/**
 * Exposes the cart API with optimistic mutations and background synchronization.
 */
export function useCart(): UseCartReturn {
  initializeCartStore()

  const cartItems = computed(() => items.value)

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const totalPrice = computed(() =>
    items.value.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0,
    ),
  )

  const cartSyncStatus = computed(() => syncStatus.value)
  const cartSyncError = computed(() => lastSyncError.value)

  /** Returns the current quantity for a ticket in cart. */
  function getQuantity(ticketId: number): number {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    return item?.quantity ?? 0
  }

  /** Adds one unit of the provided ticket to cart and schedules sync. */
  function addToCart(ticket: Ticket): void {
    const existingItem = items.value.find(
      (item) => item.ticket.id === ticket.id,
    )
    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({ ticket, quantity: 1 })
    }

    queueSync()
  }

  /** Removes a ticket line from cart and schedules sync. */
  function removeFromCart(ticketId: number): void {
    const index = items.value.findIndex((item) => item.ticket.id === ticketId)
    if (index !== -1) {
      items.value.splice(index, 1)
      queueSync()
    }
  }

  /** Increments ticket quantity and schedules sync. */
  function increaseQuantity(ticketId: number): void {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    if (item) {
      item.quantity++
      queueSync()
    }
  }

  /** Decrements ticket quantity or removes the line when it reaches zero. */
  function decreaseQuantity(ticketId: number): void {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    if (item) {
      if (item.quantity > 1) {
        item.quantity--
        queueSync()
      } else {
        removeFromCart(ticketId)
      }
    }
  }

  /** Clears all cart lines and schedules sync. */
  function clearCart(): void {
    items.value = []
    queueSync()
  }

  return {
    cartItems,
    totalItems,
    totalPrice,
    cartSyncStatus,
    cartSyncError,
    getQuantity,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    flushSync,
  }
}
