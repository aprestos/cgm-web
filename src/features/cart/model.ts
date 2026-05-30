export interface Cart {
  id: string
  ownerId?: string
  tenantId?: string
  updatedAt?: string
  items: CartItem[]
}

export interface CartItem {
  id?: string
  ticketId: number
  quantity: number
}
