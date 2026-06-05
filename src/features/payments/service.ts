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
    const tenantId = tenantStore.value?.id
    const editionId = editionStore.value?.id

    if (!tenantId || !editionId) {
      throw new Error('Missing tenant or edition')
    }

    const { data, error } = await supabase.functions.invoke<{
      url: string
      session_id: string
    }>('stripe/checkout', {
      method: 'POST',
      headers: {
        'Tenant-Id': tenantId,
        'Edition-Id': String(editionId),
      },
      body: {
        items: items.map(toSnakeCase),
        issuances: issuances.map(toSnakeCase),
        domain: window.location.origin,
      },
    })

    if (error || !data) {
      logger.error('Failed to create Stripe checkout session', { error })
      throw new Error('Unable to create Stripe checkout session')
    }

    return { url: data.url, sessionId: data.session_id }
  },
} as const

export default paymentsService
