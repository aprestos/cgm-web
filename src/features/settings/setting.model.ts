import type { SettingType } from '@/features/settings/type.enum.ts'

export type Settings = {
  [K in SettingType]: Setting
}

export interface Setting<T = unknown> {
  enabled: boolean
  value?: T
}

export interface Library {
  reservations: {
    enabled: boolean
    limit: number
    duration: number
  }
}

export interface Flea {
  commission?: number
}

export interface Tickets {
  commission?: number
}
