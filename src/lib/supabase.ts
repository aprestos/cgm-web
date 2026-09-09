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
 * The cost of that choice is that a server render is always anonymous, and
 * step 5b of `docs/ssr-migration.md` turned that cost into a feature: every
 * query a public page makes while rendering is the same for every visitor, so
 * an anonymous client is the correct one — and the only one the cache in 5a can
 * work with. What still wants a client built from a request's own cookies is
 * checkout and the account pages, and it should build one rather than making
 * this one stateful.
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
