import { supabase } from '@/lib/supabase.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { editionStore } from '@/stores/edition.ts'
import logger from '@/lib/logger.ts'
import { toSnakeCase } from '@/utils/caseConverter.ts'

export const paymentsService = {
  async createStripeCheckoutSession(
    items: Array<{ ticketId: number; quantity: number; name: string }>,
    issuances: Array<{
      ticketId: number
      recipientId?: string
      recipientName: string
      recipientEmail: string
    }>,
  ): Promise<{ url: string; sessionId: string }> {
    const { data, error } = await supabase.functions.invoke<{
      url: string
      session_id: string
    }>(`stripe/checkout`, {
      method: 'POST',
      headers: {
        'tenant-id': tenantStore.value?.id as string,
        'edition-id': String(editionStore.value?.id),
      },
      body: {
        order_id: 'order-id', //TODO: remove this
        items: items.map(toSnakeCase),
        issuances: issuances.map(toSnakeCase),
        domain: window.location.origin,
      },
    })

    if (error || !data) {
      logger.error('Failed to create order', { error })
      throw new Error('Unable to create order')
    }

    return { url: data.url, sessionId: data.session_id }
  },
} as const

export default paymentsService
