export interface CreateOrderInput {
  items: OrderItem[]
  issuances: OrderItemIssuance[]
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
