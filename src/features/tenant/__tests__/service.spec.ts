/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tenantService } from '../service'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// As stored: getByDomain camel-cases the row before returning it.
const tenantRow = {
  id: '1',
  name: 'Test Tenant',
  domain: 'example.com',
  current_event: '',
  email: '',
}

const tenant = {
  id: '1',
  name: 'Test Tenant',
  domain: 'example.com',
  currentEvent: '',
  email: '',
}

// tenant_domains is queried as .select().eq().eq().maybeSingle()
const maybeSingle = vi.fn()
const statusEq = vi.fn(() => ({ maybeSingle }))
const hostnameEq = vi.fn(() => ({ eq: statusEq }))
const select = vi.fn(() => ({ eq: hostnameEq }))

describe('tenantService.getByDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.from).mockReturnValue({
      select,
    } as unknown as ReturnType<typeof supabase.from>)
    maybeSingle.mockResolvedValue({
      data: { tenants: tenantRow },
      error: null,
    })
  })

  it('resolves the tenant the hostname points at', async () => {
    const result = await tenantService.getByDomain('example.com')

    expect(result).toEqual(tenant)
    expect(supabase.from).toHaveBeenCalledWith('tenant_domains')
    expect(select).toHaveBeenCalledWith('tenants(*)')
    expect(hostnameEq).toHaveBeenCalledWith('hostname', 'example.com')
  })

  it('only resolves hostnames that are active', async () => {
    await tenantService.getByDomain('example.com')

    expect(statusEq).toHaveBeenCalledWith('status', 'active')
  })

  it('normalises the hostname before querying', async () => {
    await tenantService.getByDomain('  EXAMPLE.com  ')

    expect(hostnameEq).toHaveBeenCalledWith('hostname', 'example.com')
  })

  it('rejects a malformed hostname without querying', async () => {
    await expect(
      tenantService.getByDomain('https://example.com/path'),
    ).rejects.toThrow('Invalid hostname')

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('throws when no tenant matches', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(tenantService.getByDomain('nonexistent.com')).rejects.toThrow(
      'No tenant found for domain: nonexistent.com',
    )
  })

  it('falls back to the dev tenant in development', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_DEV_TENANT_ID', '1')
    const getById = vi.spyOn(tenantService, 'getById').mockResolvedValue(tenant)

    await expect(tenantService.getByDomain('localhost')).resolves.toEqual(
      tenant,
    )
    expect(getById).toHaveBeenCalledWith('1')

    vi.unstubAllEnvs()
  })

  // An unrecognised host in production is a domain we do not serve. Falling
  // back would hand a stranger's hostname somebody else's tenant.
  it('never falls back to the dev tenant outside development', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_DEV_TENANT_ID', '1')
    const getById = vi.spyOn(tenantService, 'getById')

    await expect(tenantService.getByDomain('stranger.com')).rejects.toThrow(
      'No tenant found for domain: stranger.com',
    )
    expect(getById).not.toHaveBeenCalled()

    vi.unstubAllEnvs()
  })
})
