# SSR migration

Tracks the move from a client-rendered SPA to server-rendered public pages.

Steps 1–3 are done and shipped as PRs #81, #82 and #83. Steps 4–6 are not
started. Everything below step 6 is a debt this migration created or uncovered,
recorded so it does not get lost.

## Why we are doing this

Two reasons, and the second is the larger one.

**Crawlable public pages.** The landing, library, tournaments and flea-market
pages are marketing surface. Today they arrive as an empty `<div id="app">`.

**The startup waterfall.** `src/main.ts` cannot render anything until it knows
which tenant the hostname belongs to, and it can only ask the browser to ask
the server:

```
blank screen
  -> tenantService.getByDomain(window.location.hostname)
  -> editionService.getCurrentEdition(tenantId)
  -> settingsService.get(tenantId, editionId)
  -> mount
  -> route component
  -> onMounted(): games, tickets, tournaments
```

Four sequential round trips before first paint, and the first exists only
because the browser has to be told what the server already knew. A server reads
the `Host` header it was handed and resolves the tenant during render. On a
multi-tenant app this is the biggest single win available, larger than the SEO.

Per-tenant, per-edition content rules out static generation — the pages differ
by host and change as editions, tickets and tournaments change. SSR (with ISR
caching) is the right tool.

## Scope

Not the whole app. Of 170 `.vue` files, **62 are admin** and 5 are auth: behind
a login, no SEO value, no reason to render on a server. They stay a SPA, which
is one line of config rather than a migration.

The target is the ~48 landing and public views.

## Done

| Step                     | PR  | What it fixed                                                                                                                                                                       |
| ------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Request-scoped stores | #81 | `tenantStore` / `editionStore` / `settingsStore` / cart were module-level refs, shared by every concurrent request on a server. Now Pinia stores, owned per app instance. 54 files. |
| 2. Cookie sessions       | #82 | The Supabase session lived in localStorage, which a server cannot read. Now `createBrowserClient` from `@supabase/ssr`, persisted in cookies.                                       |
| 3. SSR-safe locale       | #83 | `src/i18n/index.ts` read `localStorage`/`navigator` at module scope, which throws with no browser. Resolution now falls back cleanly and the preference lives in a cookie.          |

All three are behaviour-preserving in the SPA and were worth shipping on their
own merits.

---

## Step 4 — Scaffold Nuxt and resolve the tenant server-side

The framework decision and its reasoning are recorded in
[Appendix A](#appendix-a--why-nuxt). Short version: the three hard problems in
any Vue SSR migration are request-scoped state, server-to-client data handoff,
and per-route render modes. Nuxt answers all three natively; with Vike or a
hand-rolled `renderToString` server we reimplement them.

**Before anything else, verify version compatibility.** This project is on
Vite 8, vue-router 5, TypeScript 6 and ESLint 10 — ahead of most of the
ecosystem. Nuxt pins its own Vite. Run `nuxi init` in a scratch directory
against these versions and confirm the current Nuxt major supports them before
planning around it. If it lags, the choice is waiting or accepting a Vite
downgrade, and that changes the timeline.

### 4a. Do not rewrite the router yet

Nuxt's file-based routing is not required on day one. `app/router.options.ts`
can export a `routes` function that replaces the scanned routes wholesale, so
`src/router/index.ts` and `src/router/routeNames.ts` survive the move intact.
Convert to file-based later, or never. Deferring this keeps step 4 reviewable.

### 4b. Tenant from the `Host` header

The point of the whole exercise. `loadTenant()` becomes a server plugin reading
`useRequestHeaders(['host'])` instead of `window.location.hostname`, and
tenant, edition and settings are resolved during render rather than in three
round trips before it.

Keep the existing `DomainNotConfigured` fallback path (`src/main.ts`) working:
an unrecognised host must still render that page rather than a stack trace, and
it must not resolve to another tenant's data. It should now answer with an
appropriate status code rather than a 200.

### 4c. Services must stop reading ambient state

**This is the correctness item in step 4, and the one most likely to be
skipped.**

PR #81 fixed where global state is _stored_. It did not change how services
_read_ it. Seven service files still resolve the active store ambiently:

- `src/features/auth/service.ts`
- `src/features/orders/service.ts`
- `src/features/payments/service.ts`
- `src/features/library/games/service.ts`
- `src/features/library/locations/service.ts`
- `src/features/library/reservations/service.ts`
- `src/features/library/withdraws/service.ts`

```ts
// today
.eq('tenant_id', useTenantStore().tenant?.id)
```

In a browser there is one active Pinia and this is always right. On a server
`useStore()` resolves against whichever Pinia is currently active, and a call
made after an `await` may no longer be inside the request that started it. The
failure mode is a query filtered by the wrong tenant — quiet, intermittent, and
load-dependent, which is the worst combination to debug.

The fix is to pass `tenantId` / `editionId` in as parameters, the way
`src/features/tickets/service.ts` already does. `AGENTS.md` notes both styles
exist; this collapses them onto the explicit one.

Ripple, by importer count: auth 15, games 11, withdraws 11, orders 8,
reservations 6, locations 4, payments 1. Most callers are components that
already hold the store, so the change is wide but shallow.

This can ship before Nuxt, as its own PR, and probably should.

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

ISR windows are a starting guess. Tune against how often editions, tickets and
tournaments actually change.

### 5b. Data fetching

Convert the `onMounted` fetches in the public views to `useAsyncData` so the
data is fetched during render and serialised into the page instead of being
re-fetched after hydration. `src/views/landing/home/PageLanding.vue` is the
representative case: it loads trending games, tickets and tournaments in
`onMounted`.

### 5c. Hydration mismatches

Anything whose first render differs between server and client has to be wrapped
in `<ClientOnly>`:

- **Cart badge and drawer** — `src/features/cart/cart.store.ts` hydrates from
  localStorage, so the server always renders an empty cart.
- **Checkout draft restore** — `src/views/landing/checkout/checkout.draft.ts`.
- **Anything branching on `useBreakpoint` / `useMediaQuery`** — both correctly
  answer `false` with no browser, so the server renders the mobile branch and
  the client may swap it. Only matters where the two layouts must not coexist,
  which is exactly what those composables are for.

Most of the codebase is already fine: only 28 of ~265 source files touch
browser globals, and the scroll handlers in `PageLanding.vue`,
`BaseLandingPage.vue` and `HeaderComponent.vue` are all inside
`onMounted`/`onUnmounted`, which never run on a server.

### 5d. `<html lang>`

Still the static `en` in `index.html`; it does not follow the active locale.
Invisible in a SPA, wrong on a server-rendered page, and easy to fix once the
server knows the locale — the cookie from #83 is already readable per request.

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
Nuxt middleware. Defer until steps 4 and 5 are settled, and treat it as
optional rather than pending.

---

## Debts to clear

| Item                                      | Where                                                     | When                                       |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Remove the legacy session shim            | `migrateLegacySession()` in `src/lib/supabase.ts`         | Once sessions in the wild have turned over |
| Remove the legacy locale shim             | `migrateLegacyLocale()` in `src/i18n/localePreference.ts` | Same                                       |
| Services take explicit tenant/edition ids | 7 service files, see 4c                                   | Before or with step 4                      |
| `createI18n` per request                  | `src/i18n/index.ts`                                       | Step 5                                     |
| `<html lang>` follows locale              | `index.html`                                              | Step 5                                     |

Both shims are cheap to keep and destructive to remove early — leaving them a
release or two longer costs nothing.

## Suggested order

1. **4c** (services take explicit ids) — ships standalone, no Nuxt needed, and
   removes the quietest failure mode in the plan.
2. **4** version check, then scaffold + `Host`-header tenant resolution.
3. **5a/5b** route rules and `useAsyncData`.
4. **5c/5d/5e** hydration, `lang`, i18n per request.
5. **6** only if we want it.

## How to verify

Type-check and build catch neither request-scoped state bugs nor hydration
mismatches. Steps 1–3 were verified with a headless-browser pass asserting
**zero console errors** across the landing, library, tournaments, checkout,
flea-market, auth and admin routes, plus the migration paths. Keep that habit —
extend it to assert on server-rendered HTML (content present before hydration)
and to fail on hydration-mismatch warnings, which Vue logs to the console.

Concurrency is the one thing a single-browser pass cannot cover. Before
trusting the tenant resolution, drive two different tenant hostnames at the
server in parallel and assert neither renders the other's data.

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
