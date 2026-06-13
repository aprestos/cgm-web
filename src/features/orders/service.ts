import { supabase } from '@/lib/supabase.ts'
import type { CreateOrderInput } from '@/features/orders/createOrder.input.model.ts'
import { tenantStore } from '@/stores/tenant.ts'
import { editionStore } from '@/stores/edition.ts'
import logger from '@/lib/logger.ts'
import { toSnakeCaseAs } from '@/utils/caseConverter.ts'
import type { Order } from '@/features/orders/order.model.ts'

export interface OrdersOverTimeEntry {
  date: string // ISO string — YYYY-MM-DD for daily, YYYY-MM-DDTHH:mm:ss.sssZ for sub-day
  count: number
}

export type ChartGranularity =
  | '10min'
  | '30min'
  | '1h'
  | '2h'
  | '6h'
  | '12h'
  | '1d'

function bucketTimestamp(
  isoString: string,
  granularity: ChartGranularity,
): string {
  const d = new Date(isoString)
  if (granularity === '10min') {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0)
    return d.toISOString()
  }
  if (granularity === '30min') {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 30) * 30, 0, 0)
    return d.toISOString()
  }
  if (granularity === '1h') {
    d.setUTCHours(d.getUTCHours(), 0, 0, 0)
    return d.toISOString()
  }
  if (granularity === '2h') {
    d.setUTCHours(Math.floor(d.getUTCHours() / 2) * 2, 0, 0, 0)
    return d.toISOString()
  }
  if (granularity === '6h') {
    d.setUTCHours(Math.floor(d.getUTCHours() / 6) * 6, 0, 0, 0)
    return d.toISOString()
  }
  if (granularity === '12h') {
    d.setUTCHours(Math.floor(d.getUTCHours() / 12) * 12, 0, 0, 0)
    return d.toISOString()
  }
  return d.toISOString().slice(0, 10)
}

function advanceBucket(d: Date, granularity: ChartGranularity): void {
  if (granularity === '10min') d.setUTCMinutes(d.getUTCMinutes() + 10)
  else if (granularity === '30min') d.setUTCMinutes(d.getUTCMinutes() + 30)
  else if (granularity === '1h') d.setUTCHours(d.getUTCHours() + 1)
  else if (granularity === '2h') d.setUTCHours(d.getUTCHours() + 2)
  else if (granularity === '6h') d.setUTCHours(d.getUTCHours() + 6)
  else if (granularity === '12h') d.setUTCHours(d.getUTCHours() + 12)
  else d.setUTCDate(d.getUTCDate() + 1)
}

function generateBuckets(
  from: string,
  to: string,
  granularity: ChartGranularity,
): string[] {
  const buckets: string[] = []
  const end = new Date(to)
  const current = new Date(bucketTimestamp(from, granularity))
  while (current <= end) {
    buckets.push(
      granularity === '1d'
        ? current.toISOString().slice(0, 10)
        : current.toISOString(),
    )
    advanceBucket(current, granularity)
  }
  return buckets
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
    granularity: ChartGranularity = '1d',
  ): Promise<OrdersOverTimeEntry[]> {
    let query = commerceClient
      .from('orders')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .order('created_at', { ascending: true })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query
    if (error) throw error

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const bucket = bucketTimestamp(row.created_at as string, granularity)
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
    }

    if (from && to) {
      return generateBuckets(from, to, granularity).map((date) => ({
        date,
        count: counts.get(date) ?? 0,
      }))
    }

    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
  },

  async getOrdersCount(
    tenantId: string,
  ): Promise<{ count: number; revenue: number }> {
    const { data, error } = await commerceClient
      .from('orders')
      .select('count:id.count(), revenue:total.sum()')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .single<{ count: number; revenue: number | null }>()

    if (error) throw error

    return { count: data.count, revenue: data.revenue ?? 0 }
  },

  async getOrderItemsCount(tenantId: string): Promise<number> {
    const { data, error } = await commerceClient
      .from('order_items')
      .select('count:id.count()')
      .eq('tenant_id', tenantId)
      .single<{ count: number }>()

    if (error) throw error

    return data?.count ?? 0
  },

  async getOrders(
    tenantId: string,
    email?: string,
  ): Promise<
    {
      id: string
      customer_id: string | null
      status: string
      total: number
      created_at: string
      profiles: { email: string } | null
    }[]
  > {
    // When filtering by email, resolve matching profile IDs first
    let customerIds: string[] | undefined
    if (email) {
      const { data: matchedProfiles, error: matchedProfilesError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', `%${email}%`)

      if (matchedProfilesError) throw matchedProfilesError
      customerIds = ((matchedProfiles ?? []) as { id: string }[]).map(
        (p) => p.id,
      )
      if (!customerIds.length) return []
    }

    let query = commerceClient
      .from('orders')
      .select('id,customer_id,status,total,created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (customerIds) query = query.in('customer_id', customerIds)

    const { data: orders, error } = await query
    if (error) throw error
    if (!orders?.length) return []

    const allCustomerIds = [
      ...new Set(
        orders
          .map((o) => o.customer_id as string | null)
          .filter((id): id is string => id !== null),
      ),
    ]

    const { data: profileRows, error: profileRowsError } = await supabase
      .from('profiles')
      .select('id,email')
      .in('id', allCustomerIds)

    if (profileRowsError) throw profileRowsError
    const profileMap = new Map(
      ((profileRows ?? []) as { id: string; email: string }[]).map((p) => [
        p.id,
        p.email,
      ]),
    )

    return orders.map((o) => {
      const customerId = o.customer_id as string | null
      const email = customerId ? profileMap.get(customerId) : undefined

      return {
        id: o.id as string,
        customer_id: customerId,
        status: o.status as string,
        total: o.total as number,
        created_at: o.created_at as string,
        profiles: email ? { email } : null,
      }
    })
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
