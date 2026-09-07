import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LogoType, type Tenant } from '@/features/tenant/tenant.model'

const logoFallbackOrder: Record<LogoType, LogoType[]> = {
  [LogoType.favicon]: [LogoType.favicon, LogoType.square],
  [LogoType.square]: [LogoType.square],
  [LogoType.square_dark]: [LogoType.square_dark, LogoType.square],
  [LogoType.square_light]: [LogoType.square_light, LogoType.square],
  [LogoType.long]: [LogoType.long],
  [LogoType.long_dark]: [LogoType.long_dark, LogoType.long],
  [LogoType.long_light]: [LogoType.long_light, LogoType.long],
}

/**
 * The tenant the current host resolves to.
 *
 * A Pinia store rather than a module-level ref so the value is owned by one
 * app instance. Under SSR a module ref is shared by every request the server
 * handles at once, which on a multi-tenant app means one visitor's render can
 * read another tenant's data.
 */
export const useTenantStore = defineStore('tenant', () => {
  const tenant = ref<Tenant | null>(null)

  function getLogo(logoType: LogoType): string | undefined {
    const current = tenant.value

    if (!current) {
      return undefined
    }

    for (const currentLogoType of logoFallbackOrder[logoType]) {
      const logo = current.logos?.[currentLogoType]
      if (logo) {
        return logo
      }
    }

    return current.logo
  }

  function getEmail(): string | undefined {
    const current = tenant.value

    if (!current || !current.email) {
      return 'info@congrem.io'
    }

    return current.email
  }

  return { tenant, getLogo, getEmail }
})
