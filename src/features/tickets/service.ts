import { supabase } from '@/lib/supabase'
import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
} from './ticket.model'
import { toCamelCase, toSnakeCase } from '@/utils/caseConverter'

export const ticketService = {
  /**
   * Get all tickets for an edition
   */
  async get(tenantId: string, editionId: number): Promise<Ticket[]> {
    const { data, error } = await supabase
      .schema('tickets_public')
      .from('tickets')
      .select('*')
      .eq('edition_id', editionId)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return toCamelCase(data ?? []) as Ticket[]
  },

  /**
   * Get a single ticket by ID
   */
  async getById(ticketId: number): Promise<Ticket | null> {
    const { data, error } = await supabase
      .schema('tickets_public')
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (error) throw error
    return data ? (toCamelCase(data) as unknown as Ticket) : null
  },

  /**
   * Create a new ticket
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    const ticketData = toSnakeCase({
      ...input,
      active: true,
    } as Record<string, unknown>)

    const { data, error } = await supabase
      .schema('tickets_public')
      .from('tickets')
      .insert(ticketData)
      .select()
      .single()

    if (error) throw error
    return toCamelCase(data as Record<string, unknown>) as unknown as Ticket
  },

  /**
   * Update an existing ticket
   */
  async update(ticketId: number, input: UpdateTicketInput): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update(toSnakeCase(input as unknown as Record<string, unknown>))
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    return toCamelCase(data as Record<string, unknown>) as unknown as Ticket
  },

  /**
   * Delete a ticket
   */
  async delete(ticketId: number): Promise<void> {
    const { error } = await supabase
      .schema('tickets_public')
      .from('tickets')
      .delete()
      .eq('id', ticketId)

    if (error) throw error
  },
}

export default ticketService
