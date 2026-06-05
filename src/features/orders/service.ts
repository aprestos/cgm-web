import { supabase } from '@/lib/supabase.ts'
import type { CreateOrderInput } from '@/features/orders/createOrder.input.model.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { editionStore } from '@/stores/edition.ts'
import logger from '@/lib/logger.ts'
import { toSnakeCaseAs } from '@/utils/caseConverter.ts'
import type { Order } from '@/features/orders/order.model.ts'

const commerceClient = supabase.schema('commerce')

export const orderService = {
  /**
   * Polls the commerce.orders table at a fixed interval until the given order
   * reaches the 'paid' status or the timeout elapses.
   *
   * @param sessionId
   * @param intervalMs  - How often to check (default 2 s).
   * @param timeoutMs   - Give up after this many milliseconds (default 90 s).
   */
  async pollUntilPaid(
    sessionId: string,
    intervalMs = 10_000,
    timeoutMs = 90_000,
  ): Promise<Order> {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      const { data, error } = await commerceClient
        .from('orders')
        .select('id,status,total')
        .eq('stripe_session_id', sessionId)
        .maybeSingle<{ id: string; total: number; status: string }>()

      if (error) {
        logger.error('Error polling order status', { sessionId, error })
      } else if (data?.status === 'paid') {
        const [items, issuances] = await Promise.all([
          supabase
            .schema('commerce')
            .from('order_items')
            .select('ticket_id,quantity')
            .eq('order_id', data.id),
          supabase
            .schema('tickets')
            .from('issuances')
            .select('ticket_id,recipient_id,recipient_email,recipient_name')
            .eq('order_id', data.id),
        ])

        const order: Order = data as unknown as Order

        if (!items.error && items.data) order.items = items.data

        if (!issuances.error && issuances.data) order.issuances = issuances.data

        return order
      }

      // Wait before next attempt (unless we have already exceeded the deadline)
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(intervalMs, remaining)),
      )
    }

    throw new Error(
      `No order with stripe_session_id '${sessionId}' reached 'paid' status within the allowed time.`,
    )
  },

  async create(order: CreateOrderInput): Promise<{ orderId: string }> {
    const body = toSnakeCaseAs<Record<string, unknown>>(
      order as unknown as Record<string, unknown>,
    )

    const { data, error } = await supabase.functions.invoke<{
      order_id: string
      items_inserted: number
      issuances_inserted: number
    }>(`orders`, {
      method: 'POST',
      headers: {
        'Tenant-Id': tenantStore.value?.id as string,
        'Edition-Id': String(editionStore.value?.id),
      },
      body,
    })

    if (error || !data) {
      logger.error('Failed to create order', { error })
      throw new Error('Unable to create order')
    }

    return { orderId: data.order_id }
  },
} as const

export default orderService
