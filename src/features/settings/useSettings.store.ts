import { ref } from 'vue'
import type { Setting, Settings } from '@/features/settings/setting.model'
import { settingsService } from './service'
import { tenantStore } from '@/features/tenant/tenant.store'
import { editionStore } from '@/features/events/edition.store'

export const settingsStore = ref<Settings | null>(null)

export const saveEnabledFeatures = async (
  features: Record<string, boolean>,
): Promise<void> => {
  const tenantId = tenantStore?.value?.id
  const editionId = editionStore?.value?.id

  if (!features || !tenantId || !editionId) return

  const promises: Array<Promise<void>> = Object.entries(features).map(
    async ([key, value]) => {
      const response = await settingsService.updateEnabled(
        tenantId,
        editionId,
        key,
        value,
      )
      if (settingsStore.value && response)
        (settingsStore.value[key as keyof Settings] as Setting<unknown>) =
          response
    },
  )

  await Promise.all(promises)
}
