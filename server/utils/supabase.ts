import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Supabase for the handful of routes that are not part of the Vue app.
 *
 * `src/lib/supabase.ts` cannot be imported here. These routes are bundled by
 * Nitro, not by Vite, so the `import.meta.env` that module reads does not
 * exist, and the server tsconfig has no DOM for the `window` checks it makes.
 * Its config comes through `runtimeConfig` instead.
 *
 * Anonymous and stateless, for the same reason the server build of the app's
 * client is: a client that carried a session would carry it between concurrent
 * requests. Nothing served from here is personal, so nothing wants one.
 */
export function serverSupabase(): SupabaseClient {
  if (client) return client

  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig()

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return client
}
