import { supabase } from '@/lib/supabase'
import type {
  CreateTicketDayInput,
  CreateTicketInput,
  Ticket,
  TicketDay,
  UpdateTicketInput,
} from './ticket.model'
import { toCamelCaseAs, toSnakeCaseAs } from '@/utils/caseConverter'

const table = supabase.schema('tickets').from('types')

export const ticketService = {
  /**
   * Get all tickets for an edition
   */
  async get(tenantId: string, editionId: number): Promise<Ticket[]> {
    const { data, error } = await table
      .select('*')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return toCamelCaseAs<Ticket>(data ?? [])
  },

  async getAll(tenantId: string, editionId: number): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*,access_days:ticket_days!ticket_type_days(day)')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return toCamelCaseAs<Ticket>(data ?? [])
  },

  /**
   * Get the pre-defined days an edition offers, that ticket types can be linked to
   */
  async getDays(tenantId: string, editionId: number): Promise<TicketDay[]> {
    const { data, error } = await supabase
      .from('ticket_days')
      .select('*')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)
      .order('day', { ascending: true })

    if (error) throw error
    return toCamelCaseAs<TicketDay>(data ?? [])
  },

  /**
   * Create a new pre-defined day for an edition, that ticket types can be linked to
   */
  async createDay(input: CreateTicketDayInput): Promise<TicketDay> {
    const { data, error } = await supabase
      .from('ticket_days')
      .insert(
        toSnakeCaseAs<Record<string, unknown>>(
          input as unknown as Record<string, unknown>,
        ),
      )
      .select()
      .single()

    if (error) throw error
    return toCamelCaseAs<TicketDay>(data)
  },

  /**
   * Update the people capacity for a pre-defined day
   */
  async updateDayQuantity(dayId: string, quantity: number): Promise<TicketDay> {
    const { data, error } = await supabase
      .from('ticket_days')
      .update({ quantity })
      .eq('id', dayId)
      .select()
      .single()

    if (error) throw error
    return toCamelCaseAs<TicketDay>(data)
  },

  /**
   * Delete a pre-defined day. Fails if the day is still linked to a ticket type.
   */
  async deleteDay(dayId: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_days')
      .delete()
      .eq('id', dayId)

    if (error) throw error
  },

  /**
   * Get a single ticket by ID
   */
  async getById(ticketId: number): Promise<Ticket | null> {
    const { data, error } = await table.select('*').eq('id', ticketId).single()

    if (error) throw error
    return data ? toCamelCaseAs<Ticket>(data) : null
  },

  /**
   * Create a new ticket type and link it to its selected access days
   */
  async create(
    tenantId: string,
    editionId: number,
    input: CreateTicketInput,
  ): Promise<Ticket> {
    const { data, error } = await supabase.functions.invoke('tickets/types', {
      method: 'POST',
      body: {
        name: input.name,
        price: input.price,
        is_popular: input.isPopular,
        status: 'active',
        days: input.dayIds,
      },
      headers: {
        'Tenant-id': tenantId,
        'Edition-id': String(editionId),
      },
    })

    if (error) throw error

    return toCamelCaseAs<Ticket>(data)
  },

  /**
   * Update an existing ticket
   */
  async update(ticketId: number, input: UpdateTicketInput): Promise<Ticket> {
    const { data, error } = await table
      .update(
        toSnakeCaseAs<Record<string, unknown>>(
          input as unknown as Record<string, unknown>,
        ),
      )
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    return toCamelCaseAs<Ticket>(data)
  },

  /**
   * Delete a ticket
   */
  async delete(ticketId: number): Promise<void> {
    const { error } = await table.delete().eq('id', ticketId)

    if (error) throw error
  },
}

export default ticketService
