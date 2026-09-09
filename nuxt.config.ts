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
 */
const publicPage = {
  cache: {
    maxAge: 60,
    varies: ['host', 'x-forwarded-host', 'x-app-locale'],
  },

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
 * The app still lives in `src/`, still uses the routes in `src/router`, and
 * still boots Pinia, i18n and unhead — those moved from `src/main.ts` into
 * `src/plugins/`. What changed is who renders first.
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

  // There is no `pages/` directory: `src/router.options.ts` hands Nuxt the
  // existing route table wholesale. Routing still has to be switched on for
  // that hook to be read at all.
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
      link: [{ rel: 'icon', href: '/favicon.ico' }],
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

  typescript: {
    // `pnpm run type-check` runs vue-tsc over the generated config; running it
    // again inside the dev server would only make it slower.
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        // Nuxt turns this on and the SPA's tsconfig did not, so adopting the
        // generated config wholesale would fail the build on ~20 pre-existing
        // unchecked array and record accesses. Tightening those is worth doing
        // and has nothing to do with rendering on a server, so it is not done
        // in the same change.
        noUncheckedIndexedAccess: false,
      },
    },
  },
})
