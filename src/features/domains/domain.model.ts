/**
 * Who provisions the hostname. `wildcard` and `service` are served without a
 * registration of their own, so there is nothing to set up and no provider
 * state to poll; `railway` is an individual custom domain, which has both.
 */
export type DomainProvider = 'wildcard' | 'railway' | 'service'

export type DomainStatus = 'pending' | 'verifying' | 'active' | 'failed'

/**
 * A DNS record the customer has to create, exactly as the provider described
 * it. The shape differs between an apex (an A record) and a subdomain (a
 * CNAME), so it is rendered rather than reconstructed.
 */
export interface DnsRecord {
  hostlabel: string
  fqdn?: string
  recordType?: string
  requiredValue: string
  currentValue?: string | null
  purpose?: string
  status?: string
  zone?: string
}

export interface TenantDomain {
  id: number
  tenantId: string
  hostname: string
  provider: DomainProvider
  providerId: string | null
  status: DomainStatus
  dnsRecords: DnsRecord[] | null
  certStatus: string | null
  lastError: string | null
  isPrimary: boolean
  createdAt: string
  verifiedAt: string | null
}
