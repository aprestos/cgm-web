export interface OrderTicketInfo {
  group: string
  validFrom: string
  validUntil: string
}

export interface Order {
  id: string
  status: 'placed' | 'paid' | 'canceled' | 'failed' | 'refunded'
  total: number
  created_at?: string
  customer_id?: string
  customer?: {
    email?: string
    name?: string
  }
  items: OrderItem[]
  issuances: Issuance[]
  stripe_session_id?: string
}

export interface OrderItem {
  ticket_id: number
  quantity: number
  ticket?: OrderTicketInfo
}

export interface Issuance {
  ticket_id: number
  recipient_id?: string
  recipient_name: string
  recipient_email: string
  ticket: {
    valid_from: string
    valid_until: string
  }
}
