import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DomainNotConfigured from '@/components/DomainNotConfigured.vue'
import type { DomainStatus } from '@/features/domains/domain.model'

const render = (
  status: DomainStatus | null,
): ReturnType<typeof mount<typeof DomainNotConfigured>> =>
  mount(DomainNotConfigured, {
    props: { hostname: 'theircon.com', status },
  })

describe('DomainNotConfigured', () => {
  it('always names the hostname that failed to resolve', () => {
    expect(render(null).text()).toContain('theircon.com')
  })

  it('tells an unrecognised host it is not connected', () => {
    const text = render(null).text()

    expect(text).toContain('not connected')
    expect(text).toContain('convention settings')
  })

  it.each<DomainStatus>(['pending', 'verifying'])(
    'asks a %s host to wait',
    (status) => {
      const text = render(status).text()

      expect(text).toContain('Almost there')
      expect(text).toContain('still being verified')
    },
  )

  // Telling somebody to wait for something that has already given up leaves
  // them refreshing a page that will never come good.
  it('does not ask a failed host to wait', () => {
    const text = render('failed').text()

    expect(text).not.toContain('Almost there')
    expect(text).toContain('not connected')
  })
})
