/**
 * Drives several tenant hostnames at a running server at once and asserts that
 * no response carries another tenant's data.
 *
 * This is the one failure mode a single-browser pass cannot see. Type-checking
 * and a headless run over each page in turn both pass happily while a server
 * hands one visitor another tenant's edition, because the bug only appears
 * when two requests are in flight at the same time: Pinia's active instance
 * and Nuxt's current request are module globals, and they change at every
 * `await`. It has already caught one real bug in `plugins/tenant.ts`.
 *
 * Not a CI test — it needs real hostnames and a real database. Run it against
 * a build before trusting a change to how the tenant is resolved:
 *
 *   pnpm run build
 *   PORT=3123 node .output/server/index.mjs &
 *   pnpm run check:tenant-isolation
 *
 * `HOSTS` is a hostname-to-expected-title map; override it with the
 * `TENANT_HOSTS` env var as `host=title,host=title`.
 */
import http from 'node:http'

const PORT = Number(process.env.PORT ?? 3123)
const ROUNDS = Number(process.env.ROUNDS ?? 15)

const HOSTS = Object.fromEntries(
  (
    process.env.TENANT_HOSTS ??
    'kidult.congrem.io=Maia Kidult Weekend,vianacon.congrem.io=VianaCON 2026'
  )
    .split(',')
    .map((pair) => pair.split('=').map((part) => part.trim())),
)

const UNCONFIGURED_HOST = process.env.UNCONFIGURED_HOST ?? 'nope.example.com'

/**
 * `node:http` rather than `fetch`: `Host` is a forbidden header for fetch,
 * which drops it silently — and every request then resolves to 127.0.0.1,
 * which looks exactly like a broken tenant lookup.
 */
function get(host, path = '/', headers = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path,
        headers: { Host: host, ...headers },
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () =>
          resolve({ status: response.statusCode, html: body }),
        )
      },
    )
    request.on('error', reject)
    request.end()
  })
}

const titleOf = (html) =>
  (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(/&#x27;/g, "'")

const hosts = Object.keys(HOSTS)
const failures = []

for (let round = 0; round < ROUNDS; round++) {
  const responses = await Promise.all(
    hosts.map(async (host) => ({ host, ...(await get(host)) })),
  )

  for (const { host, status, html } of responses) {
    if (status !== 200) failures.push(`${host}: status ${status}`)

    // `startsWith`, not equality: the landing page's title is the edition's
    // name followed by a tagline (step 7 item 6). The name still has to come
    // first, and it is still the whole point of the assertion — another
    // tenant's name would not be the prefix.
    const title = titleOf(html)
    if (!title.startsWith(HOSTS[host]))
      failures.push(
        `${host}: title "${title}", expected to start "${HOSTS[host]}"`,
      )

    for (const other of hosts) {
      if (other !== host && html.includes(HOSTS[other]))
        failures.push(`${host}: leaked "${HOSTS[other]}"`)
    }
  }
}

/**
 * The cached public pages, driven in every (host, language) combination at
 * once.
 *
 * Step 5a put those two things in the cache key and nothing else. A key
 * missing the host serves one tenant's page to another; a key missing the
 * language serves a Portuguese page to an English visitor. Both only appear
 * on the *second* request for a key, so a single pass over each combination
 * would find neither — the rounds are the point.
 */
const CACHED_PATHS = ['/', '/library', '/tournaments']
const LANGUAGES = ['en', 'pt']

for (let round = 0; round < ROUNDS; round++) {
  const combinations = hosts.flatMap((host) =>
    CACHED_PATHS.flatMap((path) =>
      LANGUAGES.map((language) => ({ host, path, language })),
    ),
  )

  const responses = await Promise.all(
    combinations.map(async (combination) => ({
      ...combination,
      ...(await get(combination.host, combination.path, {
        'Accept-Language': combination.language,
      })),
    })),
  )

  for (const { host, path, language, status, html } of responses) {
    const where = `${host}${path} [${language}]`
    if (status !== 200) failures.push(`${where}: status ${status}`)

    const lang = html.match(/<html[^>]*lang="([a-z]+)"/)?.[1]
    if (lang !== language) failures.push(`${where}: served lang "${lang}"`)

    if (!html.includes(HOSTS[host]))
      failures.push(`${where}: does not name its own tenant`)

    for (const other of hosts) {
      if (other !== host && html.includes(HOSTS[other]))
        failures.push(`${where}: leaked "${HOSTS[other]}"`)
    }
  }
}

/**
 * `sitemap.xml` resolves the tenant a second time, in a Nitro route that
 * cannot import the app's services and so repeats their queries (step 7). It
 * is the one other place a host is turned into tenant data, which makes it the
 * one other place this can go wrong — and every URL it prints is a public
 * statement about which pages belong to which domain.
 */
for (let round = 0; round < ROUNDS; round++) {
  const sitemaps = await Promise.all(
    hosts.map(async (host) => ({
      host,
      ...(await get(host, '/sitemap.xml')),
    })),
  )

  for (const { host, status, html } of sitemaps) {
    if (status !== 200) failures.push(`${host} sitemap: status ${status}`)
    if (!html.includes(`<loc>http://${host}/</loc>`))
      failures.push(`${host} sitemap: does not list its own origin`)

    for (const other of hosts) {
      if (other !== host && html.includes(other))
        failures.push(`${host} sitemap: leaked ${other}`)
    }
  }
}

const strangerSitemap = await get(UNCONFIGURED_HOST, '/sitemap.xml')
if (strangerSitemap.status !== 404)
  failures.push(
    `${UNCONFIGURED_HOST} sitemap: status ${strangerSitemap.status}, expected 404`,
  )
for (const host of hosts) {
  if (strangerSitemap.html.includes(host))
    failures.push(`${UNCONFIGURED_HOST} sitemap: leaked ${host}`)
}

const stranger = await get(UNCONFIGURED_HOST)
if (stranger.status !== 404)
  failures.push(`${UNCONFIGURED_HOST}: status ${stranger.status}, expected 404`)
if (!stranger.html.includes('This domain is not connected'))
  failures.push(`${UNCONFIGURED_HOST}: did not render DomainNotConfigured`)

const cachedRequests =
  ROUNDS * hosts.length * CACHED_PATHS.length * LANGUAGES.length
console.log(
  `${ROUNDS} rounds: ${ROUNDS * hosts.length * 2} uncached + ${cachedRequests} cached requests`,
)

if (failures.length) {
  console.error('FAILURES:\n' + [...new Set(failures)].join('\n'))
  process.exit(1)
}

console.log(
  'no cross-tenant or cross-language leakage in pages, cached pages or sitemaps',
)
