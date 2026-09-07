import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Setting, Settings } from '@/features/settings/setting.model'
import { settingsService } from './service'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

/**
 * Feature settings for the active tenant/edition pair.
 *
 * Request-scoped for the same reason as the tenant store: on a server a
 * module-level ref is shared across concurrent renders.
 */
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)

  const saveEnabledFeatures = async (
    features: Record<string, boolean>,
  ): Promise<void> => {
    const tenantId = useTenantStore().tenant?.id
    const editionId = useEditionStore().edition?.id

    if (!features || !tenantId || !editionId) return

    const promises: Array<Promise<void>> = Object.entries(features).map(
      async ([key, value]) => {
        const response = await settingsService.updateEnabled(
          tenantId,
          editionId,
          key,
          value,
        )
        if (settings.value && response)
          (settings.value[key as keyof Settings] as Setting<unknown>) = response
      },
    )

    await Promise.all(promises)
  }

  return { settings, saveEnabledFeatures }
})
