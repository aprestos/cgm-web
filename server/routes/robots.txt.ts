import { requestOrigin } from '../utils/request-origin'

/**
 * `robots.txt`, per host.
 *
 * A file in `public/` would be one file for every tenant, and the one line
 * that matters here — where the sitemap is — has to name the host it is being
 * served from. So it is a route.
 *
 * Until this existed, `/robots.txt` fell through to the router's catch-all and
 * answered a 302 to an HTML page. See step 7 of `docs/ssr-migration.md`.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    // Behind a login or personal to one visitor: nothing to index, and
    // `/checkout` in particular is a page a crawler can only ever see empty.
    'Disallow: /admin',
    'Disallow: /auth',
    'Disallow: /checkout',
    'Disallow: /users',
    '',
    `Sitemap: ${requestOrigin(event)}/sitemap.xml`,
    '',
  ].join('\n')
})
