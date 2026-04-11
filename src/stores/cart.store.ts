import { ref, computed, type ComputedRef } from 'vue'
import type { Ticket } from '@/features/tickets/ticket.model'

export interface CartItem {
  ticket: Ticket
  quantity: number
}

const items = ref<CartItem[]>([])

interface UseCartReturn {
  cartItems: ComputedRef<CartItem[]>
  totalItems: ComputedRef<number>
  totalPrice: ComputedRef<number>
  getQuantity: (ticketId: number) => number
  addToCart: (ticket: Ticket) => void
  removeFromCart: (ticketId: number) => void
  increaseQuantity: (ticketId: number) => void
  decreaseQuantity: (ticketId: number) => void
  clearCart: () => void
}

export function useCart(): UseCartReturn {
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

  function getQuantity(ticketId: number): number {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    return item?.quantity ?? 0
  }

  function addToCart(ticket: Ticket): void {
    const existingItem = items.value.find(
      (item) => item.ticket.id === ticket.id,
    )
    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({ ticket, quantity: 1 })
    }
  }

  function removeFromCart(ticketId: number): void {
    const index = items.value.findIndex((item) => item.ticket.id === ticketId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function increaseQuantity(ticketId: number): void {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    if (item) {
      item.quantity++
    }
  }

  function decreaseQuantity(ticketId: number): void {
    const item = items.value.find((item) => item.ticket.id === ticketId)
    if (item) {
      if (item.quantity > 1) {
        item.quantity--
      } else {
        removeFromCart(ticketId)
      }
    }
  }

  function clearCart(): void {
    items.value = []
  }

  return {
    cartItems,
    totalItems,
    totalPrice,
    getQuantity,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  }
}
