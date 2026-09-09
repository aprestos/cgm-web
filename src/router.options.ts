import type { RouterConfig } from '@nuxt/schema'

/**
 * What is left of the router configuration once the routes come from files.
 *
 * This used to hand Nuxt the hand-written table in `src/router/index.ts`
 * instead of a scanned tree (step 4a), which is what let that file survive the
 * move to Nuxt unchanged. Step 6 scanned the tree, so the table is gone and
 * only this is left.
 *
 * `scrollBehavior` came straight from the original `createRouter()` call. The
 * `history` option did not: Nuxt owns the history mode, and picks the right
 * one for the server and the browser on its own.
 */
export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
}
