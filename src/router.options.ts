import type { RouterConfig } from '@nuxt/schema'
import { routes } from '@/router'

/**
 * Hands Nuxt the hand-written route table instead of a scanned `pages/` tree.
 *
 * Nuxt calls `routes()` with whatever it found by scanning — nothing, here —
 * and uses what we return. That is what lets `src/router` survive the move to
 * Nuxt unchanged; see step 4a of `docs/ssr-migration.md`.
 *
 * `scrollBehavior` came straight from the old `createRouter()` call. The
 * `history` option did not: Nuxt owns the history mode, and picks the right
 * one for the server and the browser on its own.
 */
export default <RouterConfig>{
  routes: () => routes,

  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
}
