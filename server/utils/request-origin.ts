import type { H3Event } from 'h3'

/**
 * The absolute origin this request came in on.
 *
 * Every URL a crawler is given has to be absolute and has to name the tenant's
 * own host, which on a multi-tenant app is only knowable per request. Behind
 * Vercel the client-facing protocol and host are in the forwarded headers; the
 * connection h3 sees is plain http to the function.
 */
export function requestOrigin(event: H3Event): string {
  const host = getRequestHost(event, { xForwardedHost: true })
  const protocol = getRequestProtocol(event, { xForwardedProto: true })
  return `${protocol}://${host}`
}
