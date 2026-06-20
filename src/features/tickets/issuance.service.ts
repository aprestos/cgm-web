import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger.ts'
import { AlreadyCheckedInError } from '@/utils/error/AlreadyCheckedIn.error.ts'

export const ticketIssuanceService = {
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

  async checkin(orderId: string) {
    //this should be done using the issuance_id
    // but, due to a stroke of genius I missed the issuance_id in the ticket qr code... :facepalm:
    const { data, error } = await supabase
      .schema('tickets')
      .from('issuances')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'valid')

    if (error || !data) {
      logger.warn('Unable to load issuance', { orderId })
      throw new Error('Unable to checkin')
    }

    if (data?.length === 0) {
      throw new AlreadyCheckedInError('Unable to checkin')
    }
    const issuance = data[0]

    await supabase
      .schema('tickets')
      .from('issuances')
      .update({ status: 'checked-in' })
      .eq('id', issuance.id)
  },

  async getStatus(orderId: string): Promise<string> {
    //this should be done using the issuance_id
    // but, due to a stroke of genius I missed the issuance_id in the ticket qr code... :facepalm:
    const { data, error } = await supabase
      .schema('tickets')
      .from('issuances')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'valid')

    if (error || !data) {
      logger.warn('Unable to check ticket status', { orderId })
      throw new Error('Unable to check status')
    }

    if (data?.length === 0) {
      return 'checked-in'
    } else {
      return 'valid'
    }
  },
}

export default ticketIssuanceService
