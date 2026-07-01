import { useStorage } from '@vueuse/core'

const TENANT_ID_KEY = 'tenant_id'
const tenantId = useStorage<string | null>(TENANT_ID_KEY, null)

export const getTenantId = (): string | null => tenantId.value

export const setTenantId = (id: string): void => {
  tenantId.value = id
}

// Default export for backward compatibility
const LocalStorageService = {
  getTenantId,
  setTenantId,
}

export default LocalStorageService
