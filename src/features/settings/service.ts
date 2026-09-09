import { supabase } from '@/lib/supabase.ts'
import type { Setting, Settings } from './setting.model'
import type { SettingType } from '@/features/settings/type.enum.ts'
import logger from '@/lib/logger.ts'

type SettingRow = Setting & { type: SettingType }

const mapToSettings = (rows: Array<SettingRow> | null): Settings => {
  if (!rows) return {}

  return rows.reduce((settings: Settings, { type, enabled, content }) => {
    settings[type] = { enabled: enabled || false, content }
    return settings
  }, {})
}

export const settingsService = {
  async get(tenantId: string, editionId: number): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('enabled', true)

    if (error) {
      logger.error('Unable to fetch settings', { tenantId, editionId, error })
      throw new Error('Unable to load configurations. Try again later')
    }

    return mapToSettings(data)
  },
  async updateEnabled(
    tenantId: string,
    editionId: number,
    type: string,
    enabled: boolean,
  ): Promise<Setting | null> {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        tenant_id: tenantId,
        edition_id: editionId,
        type: type,
        enabled,
      })
      .select()
      .single<Setting>()
    if (error) {
      logger.error('Unable to update settings', {
        tenantId,
        editionId,
        type,
        enabled,
        error,
      })
      throw new Error('Unable to update settings')
    }

    return data
  },
} as const
