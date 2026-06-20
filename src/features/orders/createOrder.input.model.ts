export interface CreateOrderInput {
  items: OrderItem[]
  issuances: OrderItemIssuance[]
  customerId: string
  currency: string
  payment: {
    type: 'stripe' | 'cash'
  }
}

export interface OrderItem {
  ticketId: number
  quantity: number
  title: string
}

export interface OrderItemIssuance {
  ticketId: number
  recipientName: string
  recipientEmail: string
  recipientId?: string
}
