import { supabase } from '@/lib/supabase.ts'
import type { CreateOrderInput } from '@/features/orders/createOrder.input.model.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { editionStore } from '@/stores/edition.ts'
import logger from '@/lib/logger.ts'
import { toSnakeCaseAs } from '@/utils/caseConverter.ts'
import type { Order } from '@/features/orders/order.model.ts'

export interface OrdersOverTimeEntry {
  date: string // YYYY-MM-DD
  count: number
}

const commerceClient = supabase.schema('commerce')

export const orderService = {
  /**
   * Polls the commerce.orders table at a fixed interval until the given order
   * reaches the 'paid' status or the timeout elapses.
   *
   * @param sessionId
   * @param interval
   * @param timeout
   */
  async pollUntilPaid(
    sessionId: string,
    interval = 2,
    timeout = 90,
  ): Promise<Order> {
    const deadline = Date.now() + timeout * 1000

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

        const order: Order = {
          id: data.id,
          status: 'paid',
          total: data.total,
          items: items.data ?? [],
          issuances: issuances.data ?? [],
        }

        if (items.error) {
          logger.error('Error loading order items', {
            orderId: data.id,
            error: items.error,
          })
        }

        if (issuances.error) {
          logger.error('Error loading order issuances', {
            orderId: data.id,
            error: issuances.error,
          })
        }

        return order
      }

      // Wait before next attempt (unless we have already exceeded the deadline)
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(interval * 1000, remaining)),
      )
    }

    throw new Error(
      `No order with stripe_session_id '${sessionId}' reached 'paid' status within the allowed time.`,
    )
  },

  async getOrdersOverTime(
    tenantId: string,
    editionId: number,
    from?: string,
    to?: string,
  ): Promise<OrdersOverTimeEntry[]> {
    let query = commerceClient
      .from('orders')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('status', 'paid')
      .order('created_at', { ascending: true })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query
    if (error) throw error

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const date = (row.created_at as string).slice(0, 10)
      counts.set(date, (counts.get(date) ?? 0) + 1)
    }

    return Array.from(counts.entries()).map(([date, count]) => ({
      date,
      count,
    }))
  },

  async getTotalItemsSold(
    tenantId: string,
    editionId: number,
  ): Promise<number> {
    const { data: orders, error: ordersError } = await commerceClient
      .from('order_items')
      .select('ticket_id')
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('status', 'paid')

    if (ordersError) throw ordersError

    const orderIds = (orders ?? []).map((o) => o.ticket_id)
    if (orderIds.length === 0) return 0

    const { data: items, error: itemsError } = await commerceClient
      .from('order_items')
      .select('quantity')
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    return (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)
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
