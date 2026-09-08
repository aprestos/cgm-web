import { createBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL as string
const ANON_KEY = import.meta.env.VITE_API_ANON_PUBLIC_JWT as string

/**
 * The Supabase client, built for wherever this module is running.
 *
 * **In the browser**, `createBrowserClient` rather than `createClient` so the
 * session is persisted in cookies instead of localStorage. A server rendering
 * a request can read a cookie; it cannot read localStorage. A session kept
 * there would make every server-rendered page anonymous and then flash to
 * signed-in on hydration.
 *
 * Cookies are scoped to the host that set them, which is what a multi-tenant
 * app wants anyway: a session established on one tenant's domain is never sent
 * to another's.
 *
 * **On the server**, a deliberately stateless anonymous client. It holds no
 * session, refreshes no token and starts no timer, which is the only reason it
 * is safe for this module to be a singleton there: a client that carried a
 * session would carry it between concurrent requests, and hand one visitor
 * another's data — the bug PR #81 fixed for the stores.
 *
 * The cost of that choice is that a server render is always anonymous. Nothing
 * relies on more today: the only queries made while rendering are the public
 * tenant, edition and settings lookups. Converting the public views to fetch
 * during render (step 5b of `docs/ssr-migration.md`) is what will need a
 * per-request client built from the request's own cookies, and it should build
 * one rather than making this one stateful.
 */
function createClientForThisEnvironment(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(API_URL, ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }) as SupabaseClient
  }

  // The two builders infer different defaults for supabase-js's schema type
  // parameters, which are all `any` here because the project has no generated
  // database types. Naming the shared type is what lets one `supabase` export
  // stand for both.
  return createBrowserClient(API_URL, ANON_KEY) as SupabaseClient
}

export const supabase = createClientForThisEnvironment()

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
