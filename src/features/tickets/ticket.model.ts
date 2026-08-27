export enum TicketGroup {
  GENERAL = 'general',
  ADMIN = 'admin',
}

export enum TicketStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export interface Ticket {
  id: number
  editionId: number
  tenantId: string
  name?: string
  group?: TicketGroup
  price: number
  active?: boolean
  quantity?: number
  /**
   * @deprecated
   */
  validFrom?: string
  /**
   * @deprecated
   */
  validUntil?: string
  saleFrom?: string
  saleUntil?: string
  createdAt: string
  isPopular?: boolean
  accessDays?: Array<{ day: string }>
  status?: TicketStatus
}

export enum IssuanceStatus {
  VALID = 'valid',
  REDEEMED = 'redeemed',
  CANCELED = 'canceled',
}

/** A ticket handed to an attendee — one per person the buyer paid for */
export interface TicketIssuance {
  id: string
  ticketId: string
  orderId: string
  /** The user who paid for the ticket */
  userId?: string
  /** The profile of the attendee, when they already have an account */
  attendeeId?: string
  attendeeName: string
  attendeeEmail: string
  status: IssuanceStatus
  createdAt: string
}

/** A pre-defined day (from `ticket_days`) an edition offers, that ticket types can be linked to */
export interface TicketDay {
  id: string
  day: string
  quantity: number
}

export interface CreateTicketDayInput {
  tenantId: string
  editionId: number
  day: string
  quantity: number
}

export interface CreateTicketInput {
  name: string
  price: number
  isPopular: boolean
  status?: 'active' | 'inactive' | 'draft'
  dayIds: string[]
}

export type UpdateTicketInput = Omit<
  Ticket,
  'id' | 'editionId' | 'tenantId' | 'createdAt'
>
