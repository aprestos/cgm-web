/* eslint-disable @typescript-eslint/unbound-method */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tenantService } from '../service'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const tenantRow = {
  id: '1',
  name: 'Test Tenant',
  domain: 'example.com',
  other_domains: ['www.example.com'],
  logo: '',
  current_event: '',
  email: '',
}

/** The tenant row as the service returns it, with keys converted to camelCase. */
const tenant = {
  id: '1',
  name: 'Test Tenant',
  domain: 'example.com',
  otherDomains: ['www.example.com'],
  logo: '',
  currentEvent: '',
  email: '',
}

const single = vi.fn()
const or = vi.fn(() => ({ single }))
const select = vi.fn(() => ({ or }))

describe('tenantService.getByDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)
    single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns the tenant matching the hostname', async () => {
    single.mockResolvedValue({ data: tenantRow, error: null })

    await expect(tenantService.getByDomain('example.com')).resolves.toEqual(
      tenant,
    )
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('tenants')
    expect(or).toHaveBeenCalledWith(
      'domain.eq.example.com,other_domains.cs.{example.com}',
    )
  })

  it('normalises the hostname before querying', async () => {
    single.mockResolvedValue({ data: tenantRow, error: null })

    await tenantService.getByDomain('  WWW.Example.COM  ')

    expect(or).toHaveBeenCalledWith(
      'domain.eq.www.example.com,other_domains.cs.{www.example.com}',
    )
  })

  it('rejects a malformed hostname without querying', async () => {
    await expect(
      tenantService.getByDomain('example.com,domain.eq.evil.com'),
    ).rejects.toThrow('Invalid hostname')
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled()
  })

  it('throws when no tenant matches', async () => {
    vi.stubEnv('DEV', false)

    await expect(tenantService.getByDomain('nonexistent.com')).rejects.toThrow(
      'No tenant found for domain: nonexistent.com',
    )
  })

  it('falls back to the dev tenant in development', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_DEV_TENANT_ID', '1')
    vi.spyOn(tenantService, 'getById').mockResolvedValue(tenant)

    await expect(tenantService.getByDomain('localhost')).resolves.toEqual(
      tenant,
    )
    expect(tenantService.getById).toHaveBeenCalledWith('1')
  })

  it('never falls back to the dev tenant outside development', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_DEV_TENANT_ID', '1')
    const getById = vi.spyOn(tenantService, 'getById')

    await expect(
      tenantService.getByDomain('someone-elses-domain.com'),
    ).rejects.toThrow('No tenant found for domain')
    expect(getById).not.toHaveBeenCalled()
  })
})
