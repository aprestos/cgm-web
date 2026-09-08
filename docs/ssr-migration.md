# SSR migration

Tracks the move from a client-rendered SPA to server-rendered public pages.

Steps 1–4 are done. Step 5 is next; step 6 is optional and may never be worth
doing. Everything below step 6 is a debt this migration created or uncovered,
recorded so it does not get lost.

## Why we are doing this

Two reasons, and the second is the larger one.

**Crawlable public pages.** The landing, library, tournaments and flea-market
pages are marketing surface. They used to arrive as an empty `<div id="app">`.

**The startup waterfall.** `src/main.ts` could not render anything until it
knew which tenant the hostname belonged to, and it could only ask the browser
to ask the server:

```
blank screen
  -> tenantService.getByDomain(window.location.hostname)
  -> editionService.getCurrentEdition(tenantId)
  -> settingsService.get(tenantId, editionId)
  -> mount
  -> route component
  -> onMounted(): games, tickets, tournaments
```

Four sequential round trips before first paint, and the first existed only
because the browser had to be told what the server already knew. A server reads
the `Host` header it was handed and resolves the tenant during render. On a
multi-tenant app this is the biggest single win available, larger than the SEO.
Step 4 collected it: the first three of those round trips are gone.

Per-tenant, per-edition content rules out static generation — the pages differ
by host and change as editions, tickets and tournaments change. SSR (with ISR
caching) is the right tool.

## Scope

Not the whole app. Of 170 `.vue` files, **62 are admin** and 5 are auth: behind
a login, no SEO value, no reason to render on a server. They stay a SPA, which
is one line of config rather than a migration.

The target is the ~48 landing and public views.

## Done

| Step                     | PR  | What it fixed                                                                                                                                                                                        |
| ------------------------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Request-scoped stores | #81 | `tenantStore` / `editionStore` / `settingsStore` / cart were module-level refs, shared by every concurrent request on a server. Now Pinia stores, owned per app instance. 54 files.                  |
| 2. Cookie sessions       | #82 | The Supabase session lived in localStorage, which a server cannot read. Now `createBrowserClient` from `@supabase/ssr`, persisted in cookies.                                                        |
| 3. SSR-safe locale       | #83 | `src/i18n/index.ts` read `localStorage`/`navigator` at module scope, which throws with no browser. Resolution now falls back cleanly and the preference lives in a cookie.                           |
| 4c. Explicit ids         | #87 | Seven services resolved the active tenant/edition through `useStore()` mid-call. On a server that reads whichever Pinia is active _now_, not the one the request started in. Ids are parameters now. |
| 4. Nuxt + `Host` header  | —   | The app is server-rendered. The tenant is resolved from the request's own `Host` header during render instead of from three round trips before first paint.                                          |

Steps 1–3 were behaviour-preserving in the SPA and were worth shipping on their
own merits.

---

## Step 4 — Scaffold Nuxt and resolve the tenant server-side (done)

The framework decision and its reasoning are in
[Appendix A](#appendix-a--why-nuxt).

**Versions.** The plan said to check compatibility before planning around Nuxt,
because this project is ahead of most of the ecosystem. It checked out: Nuxt
4.5.2 depends on Vite ^8.2, vue-router ^5.2, `@vitejs/plugin-vue` ^6.0.8 and
Vue ^3.5.40 — every one of them the version already in use, so the wait-or-
downgrade branch never had to be taken. The only bump was pinia ^4.0.2 to
^4.0.3, which `@pinia/nuxt` peers on.

### What moved where

| Was                        | Is now                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `index.html`               | `app.head` in `nuxt.config.ts`; the inline pinch-zoom script is `plugins/pinch-zoom.client.ts`            |
| `src/main.ts`              | `src/plugins/` — one plugin per thing it used to install                                                  |
| `src/App.vue`              | `src/app.vue`, Nuxt's root component                                                                      |
| `createRouter({ routes })` | `src/router.options.ts`, handing Nuxt the table in `src/router/index.ts` unchanged (4a)                   |
| `router.beforeEach`        | `src/middleware/auth.global.ts`                                                                           |
| `vite.config.ts`           | `vite` and `devServer` in `nuxt.config.ts`; `vitest.config.ts` no longer extends it and stands on its own |

`srcDir` stays `src/`. Moving 170 components into Nuxt's `app/` to earn a
convention would have buried the parts of this change that matter in a rename
diff. There is no `pages/` directory for the same reason — 4a held, and
`src/router/` survived intact.

`routeRules` keeps `/admin/**` and `/auth/**` client-rendered. They are behind
a login: nothing to crawl, and nothing a server can render that the visitor's
own session would not immediately replace.

### 4b. Tenant from the `Host` header

`src/plugins/tenant.ts`. Measured on a real tenant's landing page: the three
bootstrap round trips the browser used to make before first paint are now
**zero** — tenant, edition and settings are resolved during render and ride to
the browser in the Pinia payload. The two Supabase requests the browser still
makes are `PageLanding`'s `onMounted` fetches, which is what 5b is for.

An unrecognised host still renders `DomainNotConfigured` and never resolves to
another tenant's data, and it now says so in the status code: **404** for a
host nobody has claimed, **503** for one that is registered but still verifying
— a real address whose DNS has not propagated, where the answer has to mean
come back rather than forget this URL.

### 4c. Services must stop reading ambient state — done, shipped as #87

### What this step found

- **The same class of bug, in the new code.** `plugins/tenant.ts` first reached
  for `useEditionStore()` and `useSettingsStore()` _after_ an `await`. Pinia's
  active instance is a module global, so with two requests in flight those
  calls resolved against the other visitor's Pinia: 500s, and writes landing in
  the wrong request's stores. It type-checked, and it passed a page-by-page
  headless run. It only fell over when two hostnames were driven at the server
  at once. The plugin now takes the request's Pinia and its H3 event before its
  first `await` and passes them down — the same fix as 4c, one layer up. This
  is why `scripts/check-tenant-isolation.mjs` exists.
- **`editionService.getCurrentEdition` used `.single()`**, which throws for a
  tenant with no current edition — a state two live tenants are in right now.
  Under the SPA that left their sites a blank page, because startup never
  reached `mount()`. On a server it was a 500. It is `maybeSingle()` now; the
  return type had always said `Edition | null`.
- **`@logtail/browser` has no server to run on.** It batches and flushes on
  browser lifecycle events a render does not have, so server-side lines go to
  the console and Nitro picks them up from there.
- **`logger`'s tenant context read `getActivePinia()`**, which between two
  concurrent renders points at whichever request suspended last. It is
  browser-only now: a line stamped with the wrong tenant is worse than one
  stamped with none.

## Step 5 — Rendering strategy, data fetching, hydration

### 5a. Route rules

```ts
routeRules: {
  '/admin/**': { ssr: false },   // behind auth, no SEO value
  '/auth/**':  { ssr: false },
  '/':         { isr: 60 },
  '/library':  { isr: 60 },
  '/tournaments': { isr: 60 },
  '/flea-market': { isr: 60 },
}
```

The two `ssr: false` rules are already in `nuxt.config.ts` — step 4 could not
land without them. The ISR windows are what is left, and they are a starting
guess: tune them against how often editions, tickets and tournaments actually
change.

### 5b. Data fetching

Convert the `onMounted` fetches in the public views to `useAsyncData` so the
data is fetched during render and serialised into the page instead of being
re-fetched after hydration. `src/views/landing/home/PageLanding.vue` is the
representative case: it loads trending games, tickets and tournaments in
`onMounted`.

### 5c. Hydration mismatches

Now observable rather than predicted. A headless pass over the public routes
against the dev server reports these, and nothing else:

- **`LanguageSwitcher`'s headless-ui `Listbox`** — on every public page. The
  server and the client generate different ids and the popover markup differs,
  so it mismatches on both children and nodes. The most common cause of this is
  a component that has to be `<ClientOnly>`.
- **`FilterSidebar`** on `/library` — server renders a fragment where the
  client expects an `<aside>`; it teleports.
- **A date range in `HeroView`** — `June 20 – 21` against `June 20 – 21`. The
  strings differ invisibly, which means the server and the browser formatted
  the same instant in different zones. Luxon takes the system zone unless told
  otherwise, and a server's is not the visitor's.

Predicted and _not_ yet seen, because a fresh browser has neither: the cart
badge and drawer (`src/features/cart/cart.store.ts` hydrates from
localStorage), and the checkout draft restore
(`src/views/landing/checkout/checkout.draft.ts`). Both still need
`<ClientOnly>`.

Anything branching on `useBreakpoint` / `useMediaQuery` is the same shape:
both correctly answer `false` with no browser, so the server renders the mobile
branch and the client may swap it. It only matters where the two layouts must
not coexist, which is exactly what those composables are for.

Most of the codebase is already fine: only 28 of ~265 source files touch
browser globals, and the scroll handlers in `PageLanding.vue`,
`BaseLandingPage.vue` and `HeaderComponent.vue` are all inside
`onMounted`/`onUnmounted`, which never run on a server.

### 5d. `<html lang>`

Still a static `en`, now in `app.head.htmlAttrs` in `nuxt.config.ts`; it does
not follow the active locale. Invisible in a SPA, wrong on a server-rendered
page, and easy to fix once the server knows the locale — the cookie from #83 is
already readable per request. Blocked on 5e: setting the locale per request
against a shared `createI18n` instance is what makes that singleton dangerous.

### 5e. i18n is still a module-level singleton

`createI18n()` runs at module scope in `src/i18n/index.ts`, so the instance is
shared across concurrent requests — the same class of bug PR #81 fixed for the
stores. It has not bitten yet because locale is currently only ever read.
`@nuxtjs/i18n` handles this per request; if we do not adopt it, `createI18n`
has to move into a per-app factory.

## Step 6 — File-based routing (optional)

Only worth doing if we want Nuxt's conventions throughout. The app works
without it via `router.options.ts` (4a). Route names are already centralised in
`src/router/routeNames.ts`, and `meta.guard` / `meta.requiresAuth` map onto
Nuxt middleware. Defer until step 5 is settled, and treat it as optional rather
than pending.

---

## Debts to clear

| Item                                  | Where                                                                                              | When                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Remove the legacy session shim        | `migrateLegacySession()` in `src/lib/supabase.ts`, installed by `plugins/legacy-session.client.ts` | Once sessions in the wild have turned over             |
| Remove the legacy locale shim         | `migrateLegacyLocale()` in `src/i18n/localePreference.ts`                                          | Same                                                   |
| `createI18n` per request              | `src/i18n/index.ts`                                                                                | Step 5e — blocks anything server-side setting a locale |
| `<html lang>` follows locale          | `app.head.htmlAttrs` in `nuxt.config.ts`                                                           | Step 5d                                                |
| Per-request Supabase client           | `src/lib/supabase.ts`                                                                              | With step 5b                                           |
| `noUncheckedIndexedAccess`            | `nuxt.config.ts`                                                                                   | Whenever; ~20 sites                                    |
| Better Stack gets no server-side logs | `src/lib/logger.ts`                                                                                | When server logs matter                                |
| `/not-found` answers 200              | `src/router/index.ts`                                                                              | With the SEO work in step 5                            |

Both shims are cheap to keep and destructive to remove early — leaving them a
release or two longer costs nothing.

The **per-request Supabase client** is the one to read before step 5b. The
client in `src/lib/supabase.ts` is a module singleton, which on a server means
one object shared by every concurrent request. That is safe today only because
the server build of it is deliberately stateless and anonymous: no session, no
refresh timer, nothing to carry from one visitor to the next. The cost is that
a server render is always signed out, which is fine while the only queries made
during render are the public tenant, edition and settings lookups. The moment
public views fetch during render, that stops being true, and the fix is a
client built per request from that request's cookies — not a stateful
singleton.

**`noUncheckedIndexedAccess`** is turned off in `nuxt.config.ts`. Nuxt's
generated tsconfig turns it on and the SPA's did not, so adopting the generated
config wholesale failed on about twenty pre-existing unchecked array and record
accesses. Tightening those is worth doing and has nothing to do with rendering
on a server.

**`/not-found` answers 200.** The catch-all redirects to a route that renders
a not-found page with a success status, which a crawler will happily index. It
was invisible in a SPA. Nuxt's `createError({ statusCode: 404 })` is the fix.

## Suggested order

1. ~~**4c** (services take explicit ids)~~ — shipped as #87.
2. ~~**4** version check, then scaffold + `Host`-header tenant resolution.~~
3. **5b** `useAsyncData` in the public views, with the per-request Supabase
   client that needs.
4. **5c/5d/5e** hydration, `lang`, i18n per request.
5. **5a** ISR windows, once there is something server-fetched worth caching.
6. **6** only if we want it.

5b moved ahead of 5a: caching a render that still fetches its content in the
browser caches an empty page.

## How to verify

Type-check and build catch neither request-scoped state bugs nor hydration
mismatches. Step 4 is proof: it type-checked and built clean while handing one
visitor another tenant's Pinia.

**Concurrency.** `scripts/check-tenant-isolation.mjs` drives several tenant
hostnames at a running server at once and asserts that no response carries
another tenant's data, plus that an unknown host still answers 404 with
`DomainNotConfigured`. It found the bug described under step 4, and it is the
only check that could have. Not a CI test — it needs real hostnames and a real
database:

```sh
pnpm run build
PORT=3123 node .output/server/index.mjs &
PORT=3123 pnpm run check:tenant-isolation
```

Note for anyone writing a variant of this: `Host` is a forbidden header for
`fetch`, which drops it silently. Every request then resolves to `127.0.0.1`
and the whole run looks like a broken tenant lookup. Use `node:http` or curl.

**Console errors.** Steps 1–3 were verified with a headless pass asserting zero
console errors across the landing, library, tournaments, checkout, flea-market,
auth and admin routes. Keep that habit, and extend it to assert on
server-rendered HTML (content present before hydration) and to fail on
hydration-mismatch warnings, which Vue logs to the console. Run it against
`nuxt dev` rather than the built server: a production build reports only
`Hydration completed but contains mismatches`, with no clue which component.
The mismatches standing today are listed under 5c.

---

## Appendix A — Why Nuxt

| Problem                       | Nuxt                             | Vike / hand-rolled                       |
| ----------------------------- | -------------------------------- | ---------------------------------------- |
| Request-scoped globals        | `useState()` / per-request Pinia | hand-rolled app-context plumbing         |
| Server-to-client data handoff | `useAsyncData`                   | manual `__INITIAL_STATE__` serialisation |
| SPA for admin, SSR for public | `routeRules` one-liner           | custom per-route branching               |
| Head / SEO                    | unhead — **already in use here** | unhead, wired by hand                    |
| Vercel deploy                 | Nitro preset, ISR support        | own server plus adapter                  |

The app already uses Pinia, vue-i18n and unhead, all first-class in Nuxt. The
upfront cost is higher than Vike's; the alternative is reimplementing the four
rows above ourselves.

Rejected: **static generation** (content is per-tenant and changes),
**prerendering only** (same), **no SSR at all** (the waterfall is fixable
without SSR by parallelising the edition and settings loads, but that leaves
the public pages uncrawlable and still costs a round trip to learn the tenant).
