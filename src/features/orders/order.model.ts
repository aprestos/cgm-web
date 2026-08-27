export interface OrderTicketInfo {
  id?: string
  name?: string
  access_days?: Array<{ day: string }>
}

export interface Order {
  id: string
  status: 'placed' | 'paid' | 'canceled' | 'failed' | 'refunded'
  total: number
  created_at?: string
  /** The buyer who paid for the order */
  user_id?: string
  customer?: {
    email?: string
    name?: string
  }
  items: OrderItem[]
  issuances: Issuance[]
  stripe_session_id?: string
}

export interface OrderItem {
  ticket_id: string
  quantity: number
  ticket?: OrderTicketInfo
}

export interface Issuance {
  id: string
  ticket_id: string
  /** The profile of the attendee, when they already have an account */
  attendee_id?: string
  attendee_name: string
  attendee_email: string
  ticket?: OrderTicketInfo | null
}
