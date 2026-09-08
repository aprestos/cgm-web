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
function get(host, path = '/') {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { host: '127.0.0.1', port: PORT, path, headers: { Host: host } },
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

    const title = titleOf(html)
    if (title !== HOSTS[host])
      failures.push(`${host}: title "${title}", expected "${HOSTS[host]}"`)

    for (const other of hosts) {
      if (other !== host && html.includes(HOSTS[other]))
        failures.push(`${host}: leaked "${HOSTS[other]}"`)
    }
  }
}

const stranger = await get(UNCONFIGURED_HOST)
if (stranger.status !== 404)
  failures.push(`${UNCONFIGURED_HOST}: status ${stranger.status}, expected 404`)
if (!stranger.html.includes('This domain is not connected'))
  failures.push(`${UNCONFIGURED_HOST}: did not render DomainNotConfigured`)

console.log(
  `${ROUNDS} rounds x ${hosts.length} concurrent hosts = ${ROUNDS * hosts.length} requests`,
)

if (failures.length) {
  console.error('FAILURES:\n' + [...new Set(failures)].join('\n'))
  process.exit(1)
}

console.log('no cross-tenant leakage; every title and status correct')
