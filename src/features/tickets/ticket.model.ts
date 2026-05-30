export enum TicketGroup {
  GENERAL = 'general',
  ADMIN = 'admin',
}

export interface Ticket {
  id: number
  editionId: number
  tenantId: string
  group: TicketGroup
  price: number
  active: boolean
  quantity: number
  validFrom: string
  validUntil: string
  saleFrom?: string
  saleUntil?: string
  createdAt: string
  isPopular?: boolean
}

export type CreateTicketInput = Omit<Ticket, 'id' | 'createdAt'>

export type UpdateTicketInput = Omit<
  Ticket,
  'id' | 'editionId' | 'tenantId' | 'createdAt'
>
