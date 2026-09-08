import { migrateLegacySession } from '@/lib/supabase.ts'

/**
 * Carries a pre-cookie session out of localStorage, as `src/main.ts` did.
 *
 * Browser-only, because localStorage is. Plugins all finish before the first
 * route middleware runs, so the auth guard still sees the migrated session on
 * the very first navigation — which was the reason the old code awaited this
 * before installing the router.
 *
 * Delete once sessions in the wild have turned over; see the debts table in
 * `docs/ssr-migration.md`.
 */
export default defineNuxtPlugin({
  name: 'legacy-session',
  async setup() {
    await migrateLegacySession()
  },
})
