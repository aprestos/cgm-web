import { ref } from 'vue'
import { LogoType, type Tenant } from '@/features/tenant/tenant.model'

export const tenantStore = ref<Tenant | null>(null)

const logoFallbackOrder: Record<LogoType, LogoType[]> = {
  [LogoType.favicon]: [LogoType.favicon, LogoType.square],
  [LogoType.square]: [LogoType.square],
  [LogoType.square_dark]: [LogoType.square_dark, LogoType.square],
  [LogoType.square_light]: [LogoType.square_light, LogoType.square],
  [LogoType.long]: [LogoType.long],
  [LogoType.long_dark]: [LogoType.long_dark, LogoType.long],
  [LogoType.long_light]: [LogoType.long_light, LogoType.long],
}

export function getTenantLogo(logoType: LogoType): string | undefined {
  const tenant = tenantStore.value

  if (!tenant) {
    return undefined
  }

  for (const currentLogoType of logoFallbackOrder[logoType]) {
    const logo = tenant.logos?.[currentLogoType]
    if (logo) {
      return logo
    }
  }

  return tenant.logo
}

export function getTenantEmail(): string | undefined {
  const tenant = tenantStore.value

  if (!tenant || !tenant.email) {
    return 'info@congrem.io'
  }

  return tenant.email
}
