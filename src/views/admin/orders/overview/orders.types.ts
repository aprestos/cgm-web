import type { ChartGranularity } from '@/features/orders/service'

export type Period = '1d' | '1w' | '1m' | 'all'

export interface PeriodParams {
  period: Period
  from?: string
  to?: string
  granularity: ChartGranularity
}

export interface RecentOrder {
  id: string
  customer_id: string | null
  status: string
  total: number
  created_at: string
  profiles: { name: string; email: string } | null
}
