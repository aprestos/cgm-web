import type { ChartGranularity, OrderSummary } from '@/features/orders/service'

export type Period = '1d' | '1w' | '1m' | 'all'

export interface PeriodParams {
  period: Period
  from?: string
  to?: string
  granularity: ChartGranularity
}

export type RecentOrder = OrderSummary
