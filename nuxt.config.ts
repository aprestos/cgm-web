import tailwindcss from '@tailwindcss/vite'

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
