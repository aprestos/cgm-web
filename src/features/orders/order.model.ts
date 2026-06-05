export interface Order {
  id: string
  status: 'placed' | 'paid' | 'canceled' | 'failed'
  total: number
  items: OrderItem[]
  issuances: Issuance[]
}

export interface OrderItem {
  ticket_id: number
  quantity: number
}

export interface Issuance {
  ticket_id: number
  recipient_id?: string
  recipient_name: string
  recipient_email: string
}
