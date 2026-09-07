import { supabase } from '@/lib/supabase.ts'
import type { CreateOrderInput } from '@/features/orders/createOrder.input.model.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import logger from '@/lib/logger.ts'
import { toSnakeCaseAs } from '@/utils/caseConverter.ts'
import type { Order, OrderItem } from '@/features/orders/order.model.ts'

export interface TicketsStats {
  total: number
  distribution: TicketDistributionEntry[]
}

export interface TicketDistributionEntry {
  label: string
  count: number
}

export interface OrdersOverTimeEntry {
  date: string // ISO string — YYYY-MM-DD for daily, YYYY-MM-DDTHH:mm:ss.sssZ for sub-day
  count: number
}

/** An order as listed in the admin tables, with the buyer it belongs to */
export interface OrderSummary {
  id: string
  user_id: string | null
  status: string
  total: number
  created_at: string
  profiles: { name: string; email: string } | null
}

export type ChartGranularity =
  '10min' | '30min' | '1h' | '2h' | '6h' | '12h' | '1d'

/** Every issued ticket of an order, with the ticket type it was issued for */
const ISSUANCES_SELECT =
  'issuances:ticket_issuances(id,ticket_id,attendee_id,attendee_name,attendee_email,status,ticket:ticket_types(id,name,access_days:ticket_days!ticket_type_days(day)))'

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

export const orderService = {
  /**
   * Polls the commerce_orders table at a fixed interval until the given order
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
      const { data, error } = await supabase
        .from('commerce_orders')
        .select(
          `id,status,total,items:commerce_order_items(ticket_id,quantity),${ISSUANCES_SELECT}`,
        )
        .eq('stripe_session_id', sessionId)
        .maybeSingle<Order>()

      if (error) {
        logger.error('Error polling order status', { sessionId, error })
      } else if (data?.status === 'paid') {
        return {
          id: data.id,
          status: 'paid',
          total: data.total,
          items: data.items ?? [],
          issuances: data.issuances ?? [],
        }
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
    let query = supabase
      .from('commerce_orders')
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
    const { data, error } = await supabase
      .from('commerce_orders')
      .select('count:id.count(), revenue:total.sum()')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .single<{ count: number; revenue: number | null }>()

    if (error) throw error

    return { count: data.count, revenue: data.revenue ?? 0 }
  },

  async getOrderItemsCount(tenantId: string): Promise<number> {
    const { data, error } = await supabase
      .from('commerce_order_items')
      .select('count:id.count(), commerce_orders!inner(status)')
      .eq('tenant_id', tenantId)
      .eq('commerce_orders.status', 'paid')
      .single<{ count: number }>()

    if (error) throw error

    return data?.count ?? 0
  },

  async getOrders(tenantId: string, email?: string): Promise<OrderSummary[]> {
    // The buyer lives one foreign key away, so it is embedded instead of being
    // resolved with a second round trip. Filtering by email needs that join to
    // be inner, otherwise orders of other buyers would still come back.
    const columns = 'id,user_id,status,total,created_at'
    let query = supabase
      .from('commerce_orders')
      .select(
        email
          ? `${columns},profiles!inner(name,email)`
          : `${columns},profiles(name,email)`,
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (email) query = query.ilike('profiles.email', `%${email}%`)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []) as unknown as OrderSummary[]
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
        'Tenant-Id': useTenantStore().tenant?.id as string,
        'Edition-Id': String(useEditionStore().edition?.id),
      },
      body,
    })

    if (error || !data) {
      logger.error('Failed to create order', { error })
      throw new Error('Unable to create order')
    }

    return { orderId: data.order_id }
  },
  async getTicketsDistribution(
    tenantId: string,
    editionId: number,
  ): Promise<TicketsStats> {
    const [
      { data: orderItems, error: orderItemsError },
      { data: tickets, error: ticketsError },
    ] = await Promise.all([
      supabase
        .from('commerce_order_items')
        .select('ticket_id, quantity, commerce_orders!inner(status)')
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)
        .eq('commerce_orders.status', 'paid'),
      supabase
        .from('ticket_types')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId),
    ])

    if (ticketsError || orderItemsError) {
      console.error('Unable to get tickets distribution', {
        ticketsError,
        orderItemsError,
      })
      throw new Error('Unable to get tickets distribution')
    }
    if (!tickets?.length) return { total: 0, distribution: [] }

    let totalTickets = 0
    const totalsMap = new Map<
      string,
      {
        label: string
        count: number
      }
    >()
    for (const item of tickets ?? []) {
      totalsMap.set(item.id as string, {
        label: item.name as string,
        count: 0,
      })
    }

    const paidItems = (orderItems ?? []) as unknown as Pick<
      OrderItem,
      'ticket_id' | 'quantity'
    >[]

    paidItems.forEach((item) => {
      const mapItem = totalsMap.get(item.ticket_id)

      if (mapItem) {
        totalTickets += item.quantity
        mapItem.count += item.quantity
      }
    })

    return { total: totalTickets, distribution: Array.from(totalsMap.values()) }
  },

  async getOrder(order_id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('commerce_orders')
      .select(
        `*,customer:profiles(name,email),items:commerce_order_items(*),${ISSUANCES_SELECT}`,
      )
      .eq('id', order_id)
      .single<Order>()

    if (error || !data) {
      throw new Error('Order not found')
    }

    return {
      id: data.id,
      status: data.status,
      total: data.total,
      created_at: data.created_at,
      user_id: data.user_id,
      customer: data.customer ?? undefined,
      items: data.items ?? [],
      issuances: data.issuances ?? [],
      stripe_session_id: data.stripe_session_id,
    }
  },
} as const

export default orderService
