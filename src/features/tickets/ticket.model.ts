export enum TicketGroup {
  GENERAL = 'general',
  ADMIN = 'admin',
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
  status?: 'active' | 'inactive' | 'draft'
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
  tenantId: string
  editionId: number
  name: string
  price: number
  saleFrom?: string
  saleUntil?: string
  isPopular: boolean
  /** IDs of the `ticket_days` entries this ticket grants access to */
  dayIds: string[]
}

export type UpdateTicketInput = Omit<
  Ticket,
  'id' | 'editionId' | 'tenantId' | 'createdAt'
>
