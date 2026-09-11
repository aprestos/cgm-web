import tailwindcss from '@tailwindcss/vite'

/**
 * How a rendered public page is cached, and what makes one page different from
 * another.
 *
 * **Not `isr`.** That rule is Vercel's, and Vercel keys its ISR cache by path
 * (plus `allowQuery`) with no way to add a header — so on an app that serves
 * the same four paths on a domain per tenant, `isr: 60` on `/library` means
 * one tenant's library served to every other tenant. `cache` is Nitro's own,
 * it works on every preset, and its key is ours to define.
 *
 * **`varies` is load-bearing, in both directions.** It decides the cache key,
 * and it is also the whole set of headers the render gets to see: a rule with
 * no `varies` answered 404 for every tenant, because the handler could not
 * read its own `Host`. Anything a render depends on has to be in this list.
 *
 * Three things, and no more:
 *
 * - `host` and `x-forwarded-host` — which tenant this is. Behind a proxy only
 *   the forwarded one is the visitor's.
 * - `x-app-locale` — which language, resolved to one of two values by
 *   `server/middleware/locale.ts`. The cookie and `accept-language` that
 *   decide it are deliberately *not* varied on: one carries a session token
 *   and the other is free-form, and either would grow the key without bound.
 *
 * A session cookie is therefore invisible to a cached render, which is the
 * property that makes sharing the result between visitors safe rather than
 * merely lucky.
 *
 * 60s is a starting guess. `/library` is the one to watch: game availability
 * changes during a convention, though the browser's realtime subscription
 * corrects a stale list right after hydration.
 *
 * **Not in `nuxt dev`**, and that one is about the dev loop rather than about
 * correctness. Nitro wraps the handler in `cachedEventHandler` in the dev
 * server exactly as it does in a build, and two of its defaults then conspire
 * against editing a page. The entry is invalidated by a hash of the *handler*,
 * which is the renderer and does not change when a component is saved; and
 * `maxAge` on its own leaves `swr` at Nitro's default of `true`, so once the
 * 60s is up the stale entry is still what gets served, while the fresh render
 * happens behind it. Every reload shows the render *before* the one you are
 * waiting for. The store is `.nuxt/cache` on disk, so restarting the dev
 * server does not clear it either — a page can sit a day behind `src/`.
 *
 * The test is written this way round on purpose. `nuxt dev` sets
 * `NODE_ENV=development` and `nuxt build` sets `production`, so keying off
 * *development* means anything that is not demonstrably a dev server keeps the
 * cache, and an unset variable can never quietly ship the site uncached.
 */
const cacheInProduction =
  process.env.NODE_ENV === 'development'
    ? {}
    : {
        cache: {
          maxAge: 60,
          varies: ['host', 'x-forwarded-host', 'x-app-locale'],
        },
      }

const publicPage = {
  ...cacheInProduction,

  // For anything caching *in front* of us. Nitro answers `max-age=60`, and a
  // shared cache that took that at face value would have no idea the body
  // depends on the visitor's language — `x-app-locale` is ours, invented after
  // the request arrived, and no CDN has ever seen it. These are the two
  // headers a CDN does see that decide the answer. Naming `cookie` also means
  // most shared caches will decline to store the response at all, which is the
  // outcome we want: the only cache that knows the right key is this one.
  headers: { vary: 'accept-language, cookie' },
}

/**
 * Nuxt replaces the hand-rolled Vite SPA so the public pages can be rendered
 * on a server. See `docs/ssr-migration.md` for why.
 *
 * The app still lives in `src/` and still boots Pinia, i18n and unhead —
 * those moved from `src/main.ts` into `src/plugins/`. What changed is who
 * renders first, and that the routes are now a directory rather than a table.
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-09-08',

  // The app was never in Nuxt's default `app/` directory and moving 170
  // components to earn a convention would bury the parts of this change that
  // matter in a rename diff.
  srcDir: 'src',

  modules: ['@pinia/nuxt'],

  // Read by the server routes in `server/`, which Nitro bundles rather than
  // Vite and which therefore cannot see the `VITE_*` variables the app reads
  // through `import.meta.env`. Same project, same anonymous key.
  runtimeConfig: {
    supabaseUrl: process.env.VITE_API_URL,
    supabaseAnonKey: process.env.VITE_API_ANON_PUBLIC_JWT,
  },

  // Routes are the `src/pages/` tree. `src/router.options.ts` is only
  // `scrollBehavior` now — the hand-written table it used to hand over is
  // gone. Switched on explicitly because the directory is not Nuxt's default.
  pages: true,

  // Same list, and the same order, as the imports at the top of the old
  // `src/main.ts`. `index.css` is last because it is the Tailwind entry and
  // its layers have to win.
  css: [
    '@/assets/main.css',
    '@/assets/fonts/inter/inter.css',
    '@fontsource/space-grotesk/400.css',
    '@fontsource/space-grotesk/500.css',
    '@fontsource/space-grotesk/600.css',
    '@fontsource/space-grotesk/700.css',
    '@/index.css',
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  routeRules: {
    // Behind a login, so there is nothing to crawl and nothing a server can
    // render that the visitor's own session would not immediately replace.
    // These stay the SPA they have always been.
    '/admin/**': { ssr: false },
    '/auth/**': { ssr: false },

    // Checkout is the cart, and the cart lives in the visitor's browser: the
    // store restores it from localStorage during setup, so a server render is
    // always the empty-cart page and a returning visitor's first client render
    // disagrees with all of it. Nothing here is worth crawling either — it
    // says `noindex`. Step 5c of `docs/ssr-migration.md`.
    '/checkout': { ssr: false },

    // One person's profile and their withdrawal history, which `robots.txt`
    // already tells crawlers to leave alone. Everything on it loads in
    // `onMounted`, so a server render was only ever an empty shell — and it
    // was the last page that would have wanted a Supabase client built from
    // the visitor's own cookies. See the debts below.
    '/users/**': { ssr: false },

    // The crawlable pages, cached. `/flea-market` is not here: it renders an
    // empty div, so there is nothing to save.
    '/': publicPage,
    '/library': publicPage,
    '/tournaments': publicPage,
  },

  devServer: {
    // Was `@vitejs/plugin-basic-ssl`. Some of the app (camera access for QR
    // check-in, install prompts) only works on a secure origin, so local dev
    // is https with a self-signed certificate.
    https: true,
    host: process.env.VITE_DEV_HOST === 'true' ? '0.0.0.0' : undefined,
  },

  // Everything `index.html` used to carry. The file is gone; Nuxt renders the
  // document now.
  app: {
    rootAttrs: { class: 'w-full' },
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
      title: 'congrem.io',
      // `<html lang>` is set in `src/app.vue`, from the language the request
      // resolved to — it is not knowable here.
      // Congrem's own icons — the platform's mark, in the platform's green,
      // baked into the files because a browser tab has no CSS for
      // `currentColor` to inherit. A tenant that uploaded an icon of its own
      // gets that one instead, swapped in after hydration by `src/app.vue`;
      // these are what a crawler and every other visitor see. None of them
      // declares a `type`, deliberately: that swap rewrites the `href` of
      // every icon link and leaves the rest of the attributes alone, so a
      // `type="image/svg+xml"` here would end up describing a tenant's PNG.
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', href: '/favicon.svg', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        // iOS Safari specific
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        // Duplicated from index.css so the browser knows before the stylesheet
        // lands — otherwise the first paint still flashes light chrome.
        { name: 'color-scheme', content: 'light dark' },
        {
          name: 'theme-color',
          content: '#f9fafb',
          media: '(prefers-color-scheme: light)',
        },
        {
          name: 'theme-color',
          content: '#101828',
          media: '(prefers-color-scheme: dark)',
        },
        // Prevent automatic phone number detection
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  experimental: {
    /**
     * Keep the payload in the page rather than in a file beside it.
     *
     * Nuxt extracts the payload to `/_payload.json` for any route it considers
     * cacheable, which the rules above made all three public pages. The client
     * then fetches it — from a **separate render**, which is not the one the
     * cached HTML came from and is not cached itself.
     *
     * Two problems, and the first is the one that showed. The landing page
     * picks thirteen games at random, so the HTML said one set and the payload
     * said another, and hydration replaced every card. Anything whose render
     * is not a pure function of the cache key would have done the same. The
     * second is quieter: every hydration of a cached page was triggering a
     * full server render to fetch the payload, which is most of the work the
     * cache exists to avoid.
     *
     * Inline, the payload is part of the response the cache stored, so it
     * describes exactly the HTML it arrived with. Step 5a of
     * `docs/ssr-migration.md`.
     */
    payloadExtraction: false,
  },

  typescript: {
    // `pnpm run type-check` runs vue-tsc over the generated config; running it
    // again inside the dev server would only make it slower.
    typeCheck: false,
  },
})
