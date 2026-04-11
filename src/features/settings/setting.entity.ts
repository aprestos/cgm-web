import type { SettingType } from '@/features/settings/type.enum.ts'

export interface Setting {
  tenant_id: string
  edition_id: string
  type: SettingType
  enabled: boolean
  content: unknown
}
