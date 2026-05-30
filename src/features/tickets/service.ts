import { supabase } from '@/lib/supabase'
import type {
  Ticket,
  CreateTicketInput,
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

  /**
   * Get a single ticket by ID
   */
  async getById(ticketId: number): Promise<Ticket | null> {
    const { data, error } = await table.select('*').eq('id', ticketId).single()

    if (error) throw error
    return data ? toCamelCaseAs<Ticket>(data) : null
  },

  /**
   * Create a new ticket
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    const ticketData = toSnakeCaseAs<Record<string, unknown>>({
      ...input,
      active: true,
    } as Record<string, unknown>)

    const { data, error } = await table.insert(ticketData).select().single()

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
