import { supabase } from '@/lib/supabase'
import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
} from './ticket.model'

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
    return (data as Ticket[]) || []
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
      .single<Ticket>()

    if (error) throw error
    return data
  },

  /**
   * Create a new ticket
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    const ticketData = {
      ...input,
      active: true,
    }

    const { data, error } = await supabase
      .schema('tickets_public')
      .from('tickets')
      .insert(ticketData)
      .select()
      .single<Ticket>()

    if (error) throw error
    return data
  },

  /**
   * Update an existing ticket
   */
  async update(ticketId: number, input: UpdateTicketInput): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update(input)
      .eq('id', ticketId)
      .select()
      .single<Ticket>()

    if (error) throw error
    return data
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
