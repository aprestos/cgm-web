import { requestOrigin } from '../utils/request-origin'
import { serverSupabase } from '../utils/supabase'

/**
 * The sitemap for whichever tenant this host belongs to.
 *
 * Nothing outside the app links to `/library` or `/tournaments`, so without
 * this a crawler has no way to find either — and it cannot be a static file,
 * because which of them exists depends on the tenant's features and every URL
 * in it has to name the host it was requested on. See step 7 of
 * `docs/ssr-migration.md`.
 *
 * The three reads below are the same ones `src/plugins/tenant.ts` makes
 * through `tenantService`, `editionService` and `settingsService`, narrowed to
 * the columns a sitemap needs. They are repeated rather than imported because
 * those modules cannot be bundled by Nitro (see `server/utils/supabase.ts`);
 * if the shape of any of these tables changes, this changes with it.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')

  const hostname = (getRequestHost(event, { xForwardedHost: true }) ?? '')
    .split(':')[0]
    ?.toLowerCase()

  if (!hostname) {
    setResponseStatus(event, 404)
    return urlset([])
  }

  const supabase = serverSupabase()

  // Only an active hostname resolves, so a domain still being verified cannot
  // publish a sitemap for a tenant whose ownership is unconfirmed.
  const { data: domain } = await supabase
    .from('tenant_domains')
    .select('tenants(id)')
    .eq('hostname', hostname)
    .eq('status', 'active')
    .maybeSingle<{ tenants: { id: string } | null }>()

  const tenantId = domain?.tenants?.id
  if (!tenantId) {
    setResponseStatus(event, 404)
    return urlset([])
  }

  const { data: edition } = await supabase
    .from('editions')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('current', true)
    .maybeSingle<{ id: number }>()

  const enabled = new Set<string>()
  if (edition) {
    const { data: settings } = await supabase
      .from('settings')
      .select('type')
      .eq('tenant_id', tenantId)
      .eq('edition_id', edition.id)
      .eq('enabled', true)

    for (const row of (settings ?? []) as Array<{ type: string }>) {
      enabled.add(row.type)
    }
  }

  const origin = requestOrigin(event)

  // `/flea-market` is deliberately absent even when the feature is on: the
  // page renders an empty div, and it says `noindex` for the same reason. Add
  // it here once it has something to read.
  const paths = [
    '/',
    ...(enabled.has('library') ? ['/library'] : []),
    ...(enabled.has('tournaments') ? ['/tournaments'] : []),
  ]

  return urlset(paths.map((path) => `${origin}${path}`))
})

function urlset(urls: string[]): string {
  const entries = urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n')
}
