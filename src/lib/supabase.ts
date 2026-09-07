import { createBrowserClient } from '@supabase/ssr'

/**
 * The Supabase client.
 *
 * `createBrowserClient` rather than `createClient` so the session is persisted
 * in cookies instead of localStorage. A server rendering a request can read a
 * cookie; it cannot read localStorage. A session kept there would make every
 * server-rendered page anonymous and then flash to signed-in on hydration.
 *
 * Cookies are scoped to the host that set them, which is what a multi-tenant
 * app wants anyway: a session established on one tenant's domain is never sent
 * to another's.
 */
export const supabase = createBrowserClient(
  import.meta.env.VITE_API_URL as string,
  import.meta.env.VITE_API_ANON_PUBLIC_JWT as string,
)

/** Shape supabase-js writes under its `sb-<ref>-auth-token` storage key. */
interface StoredSession {
  access_token?: string
  refresh_token?: string
}

/**
 * Reads a session supabase-js previously wrote to localStorage.
 *
 * The key carries the project ref, which is derived from the API URL and so
 * differs per environment. Matching the shape rather than rebuilding the name
 * keeps this working on custom Supabase domains too.
 */
function readLegacySession(): { key: string; session: StoredSession } | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !/^sb-.+-auth-token$/.test(key)) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    // Newer supabase-js versions base64-prefix the payload.
    const json = raw.startsWith('base64-')
      ? atob(raw.slice('base64-'.length))
      : raw

    const session = JSON.parse(json) as StoredSession
    if (session?.access_token && session?.refresh_token) {
      return { key, session }
    }
  }

  return null
}

/**
 * Moves a pre-cookie session out of localStorage and into the cookie store.
 *
 * Without this, the switch to cookie persistence signs out everyone who was
 * already logged in, because their session sits somewhere the new client does
 * not read. Runs once: the localStorage copy is dropped as soon as the session
 * has been handed over.
 *
 * Best effort by design. Every failure here just means the visitor signs in
 * again, which is the behaviour we would have had anyway, so nothing about a
 * stale or malformed token is worth interrupting startup for.
 */
export async function migrateLegacySession(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { data } = await supabase.auth.getSession()
    if (data.session) return

    const legacy = readLegacySession()
    if (!legacy) return

    const { error } = await supabase.auth.setSession({
      access_token: legacy.session.access_token as string,
      refresh_token: legacy.session.refresh_token as string,
    })

    // Kept on failure: a refresh token that could not be exchanged now may
    // still work on the next load, and dropping it guarantees a sign-out.
    if (!error) {
      localStorage.removeItem(legacy.key)
    }
  } catch {
    // Startup continues; the visitor signs in again.
  }
}
