import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger.ts'
import { AlreadyCheckedInError } from '@/utils/error/AlreadyCheckedIn.error.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'
import {
  IssuanceStatus,
  type TicketIssuance,
} from '@/features/tickets/ticket.model.ts'

export const ticketIssuanceService = {
  /**
   * Every ticket the given user paid for in this edition — one per attendee,
   * themselves included. Canceled tickets are left out.
   */
  async getByUser(
    tenantId: string,
    editionId: number,
    userId: string,
  ): Promise<TicketIssuance[]> {
    const { data, error } = await supabase
      .from('ticket_issuances')
      .select(
        'id,ticket_id,order_id,user_id,attendee_id,attendee_name,attendee_email,status,created_at',
      )
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('user_id', userId)
      .in('status', [IssuanceStatus.VALID, IssuanceStatus.REDEEMED])
      .order('created_at', { ascending: true })

    if (error) {
      logger.warn('Unable to load the issuances of a user', {
        tenantId,
        editionId,
        userId,
        error,
      })
      throw new Error('Unable to load tickets')
    }

    return toCamelCaseAs<TicketIssuance>(data ?? [])
  },

  async sendEmails(
    tenantId: string,
    editionId: number,
    orderIds: string[],
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('tickets', {
      body: {
        order_ids: orderIds,
      },
      headers: {
        'Tenant-Id': tenantId,
        'Edition-Id': String(editionId),
      },
      method: 'POST',
    })

    if (error) {
      logger.warn('Unable to send emails', { error })
      throw new Error('Unable to send emails')
    }
  },

  /**
   * Redeems the first still-valid issuance of an order.
   *
   * Should be done with the issuance id, but the ticket qr code only carries
   * the order id... :facepalm:
   */
  async checkin(orderId: string): Promise<void> {
    const { data, error } = await supabase
      .from('ticket_issuances')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', IssuanceStatus.VALID)
      .limit(1)
      .maybeSingle<{ id: string }>()

    if (error) {
      logger.warn('Unable to load issuance', { orderId, error })
      throw new Error('Unable to checkin')
    }

    if (!data) {
      throw new AlreadyCheckedInError('Unable to checkin')
    }

    const { error: updateError } = await supabase
      .from('ticket_issuances')
      .update({ status: IssuanceStatus.REDEEMED })
      .eq('id', data.id)

    if (updateError) {
      logger.warn('Unable to redeem issuance', {
        orderId,
        issuanceId: data.id,
        error: updateError,
      })
      throw new Error('Unable to checkin')
    }
  },

  /**
   * Whether an order still has a ticket to redeem — same order id caveat as
   * {@link checkin}.
   */
  async getStatus(orderId: string): Promise<IssuanceStatus> {
    const { count, error } = await supabase
      .from('ticket_issuances')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('status', IssuanceStatus.VALID)

    if (error) {
      logger.warn('Unable to check ticket status', { orderId, error })
      throw new Error('Unable to check status')
    }

    return count ? IssuanceStatus.VALID : IssuanceStatus.REDEEMED
  },
}

export default ticketIssuanceService
