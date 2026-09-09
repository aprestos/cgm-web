# SSR migration

Tracks the move from a client-rendered SPA to server-rendered public pages.

Steps 1–4, 5b and items 1–3 of step 7 are done. 5c–5e are next, then 5a; step 6
is optional and may never be worth doing. Step 7 was added after 5b, which
showed that rendering the content on a server is only half of what the SEO
reason for this migration needed. Everything below step 7 is a debt this
migration created or uncovered, recorded so it does not get lost.

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
| 5b. Fetch during render  | —   | The public pages had been server-rendered since step 4 and still arrived empty, because every one of them fetched its content in `onMounted`. They now fetch during the render.                      |
| 7.1–7.3. Metadata        | —   | One title for the whole app, no description, canonical or `og:` tag anywhere, no `robots.txt` or `sitemap.xml`, and every unknown URL answering 200. All four fixed.                                 |

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

**Do not turn ISR on before reading this.** Nitro keys its route cache on the
path. Every tenant shares these four paths, so `/library` rendered for one
tenant is `/library` served to the next — the same class of bug as step 1 and
step 4b, this time in the cache rather than in a module global, and the worst
one yet because it survives the request. Whatever we do here has to put the
host in the cache key (`cache: { varies: ['host'] }`, or a key function) and
`scripts/check-tenant-isolation.mjs` has to be run against a build with the
rules on — driving one hostname and then another at a cold server proves
nothing, since the bug needs the first response to have been cached.

The other precondition is that these renders stay anonymous, which is why 5b
left the personal parts of each page in the browser: a page rendered with a
visitor's session is a page that must never be shared with the next visitor.

### 5b. Data fetching (done)

The public views fetched their content in `onMounted`, which never runs on a
server. So from step 4 until this one, the pages were server-rendered and still
arrived empty: a shell, a nav bar, and the empty state of everything else. The
`onMounted` fetches are `useAsyncData` now, awaited, so the content is in the
HTML the server sends.

Measured against the dev server, in visible text (tags and scripts stripped),
before and after:

| Page           | Was                                         | Is now                                        |
| -------------- | ------------------------------------------- | --------------------------------------------- |
| `/`            | 426 chars, no tickets, games or tournaments | 1222 chars, 4 tickets, 13 games, tournaments  |
| `/library`     | 84 chars — an `<h2>Games</h2>` and nothing  | 459 chars, the first 20 games with years      |
| `/tournaments` | 124 chars, all four status tabs reading 0   | 580 chars, 4 tournaments with dates and rooms |

What each view now does during render, and what it deliberately still leaves to
the browser:

- **`PageLanding.vue`** — one `useAsyncData` for games, tickets and tournaments
  together rather than three, because the server awaits them in turn and three
  awaited fetches are the waterfall this migration exists to remove.
  `Promise.allSettled`, not `Promise.all`: `ticketService.getAll` and
  `tournamentService.getAll` throw on error, and a throw during render is a 500
  for the whole page rather than one missing section, which is what the old
  per-`load` `catch` gave us. The trending-games shuffle moved into the fetch so
  it happens once, on the server — a `computed` would have reshuffled during
  hydration and mismatched all thirteen cards.
- **`public/library/GameList.vue`** — the list comes from the render; the
  realtime subscription still starts on mount, and now takes
  `{ loadInitial: false }` so it does not immediately re-fetch what the payload
  already carries. `libraryService.subscribeToUpdates` grew that option for it;
  the admin caller is unchanged.
- **`public/tournaments/HomeView.vue`** — the tournaments come from the render.
  Which of them _this_ visitor has joined does not: that stays in `onMounted`,
  behind `authService.getUser`.

**The per-request Supabase client turned out not to be needed here**, and the
debt is re-scoped rather than paid. Everything these three views fetch is the
same for every visitor, so the anonymous server client in `src/lib/supabase.ts`
is the right one — and more than that, it is the only one 5a can work with,
because a render personalised with someone's session is a render that cannot be
cached and handed to the next visitor. What is left personal — who you are,
what you reserved, which tournaments you joined — stays in the browser on
purpose. The views that genuinely need the visitor's own session during render
are checkout and the account pages, which are not SEO surface and should not be
ISR-cached either.

Two smaller consequences worth knowing about:

- **Skeletons on `/library` and `/tournaments` are gone**, not hidden. With the
  list in the HTML there is no first-load pending state left for them to show,
  and a client-side navigation into either page waits on the same
  `useAsyncData` before it swaps the page in. Joining a tournament reloads the
  list into a plain ref rather than calling `refresh()`, which would have moved
  the request back to `pending` and blanked the grid into a skeleton that used
  not to appear.
- **`/library` renders only its first 20 games.** The rest arrive by infinite
  scroll, which a crawler does not do, so the other ~200 are still invisible to
  one. That is a step 7 problem, not a rendering one.

### 5c. Hydration mismatches

Now observable rather than predicted. A headless pass over the public routes
against the dev server reports these, and nothing else — the counts below are
after 5b, which added no new ones of its own:

- **`LanguageSwitcher`'s headless-ui `Listbox`** — on every public page. The
  server and the client generate different ids and the popover markup differs,
  so it mismatches on both children and nodes. The most common cause of this is
  a component that has to be `<ClientOnly>`.
- **`FilterSidebar`** on `/library` — server renders a fragment where the
  client expects an `<aside>`; it teleports.
- ~~**A date range in `HeroView`**~~ — **fixed, and it was not what this said.**
  The two strings differ by their separator, not their date: `Intl.DateTimeFormat.formatRange`
  pads the en dash with whatever the runtime's ICU decides, and Node 26 picks
  U+2009 THIN SPACE where Chrome picks a plain U+0020. Not a timezone at all —
  the same instant, formatted by two different ICU builds. `formatDateRange` in
  `src/utils/date.ts` no longer calls the native `formatRange`; it goes through
  the Luxon path that was previously only a fallback, with a separator we own.
  That also removed a zone bug nobody had noticed: the native path read its ends
  through `new Date`, which parses a date-only ISO string as UTC midnight and
  then prints it locally, so `2026-12-28` was already December 27th for anyone
  west of Greenwich.

  Worth keeping in mind for the rest of 5c: this one only became visible on the
  landing page, and 5b then reproduced it in `TicketsView` the moment tickets
  started rendering on the server. **A mismatch you cannot see is a mismatch in
  content that was not being rendered yet.** Fixing it took `/` to zero console
  errors and warnings.

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

## Step 7 — Crawlable is not the same as indexable

Added after 5b, because 5b is what made it obvious. The pages now contain their
content, and everything a crawler reads _about_ a page is still missing or
wrong. The plan up to here only ever covered getting the content rendered; this
is the other half of the SEO reason for the migration, and none of it needs SSR
to have been done first — it was just as absent from the SPA.

Measured against a real tenant on the dev server:

| What                        | State before this step                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `<title>`                   | One for the whole app — the edition name, set once in `app.vue`. `/library`, `/tournaments` and `/flea-market` all carry it verbatim |
| `<meta name="description">` | None on any page                                                                                                                     |
| `<link rel="canonical">`    | None                                                                                                                                 |
| `og:*` / `twitter:*`        | None — a shared link previews as a bare URL                                                                                          |
| JSON-LD                     | None, on a site whose entire subject is an event with dates, a venue and ticket offers                                               |
| `robots.txt`                | 302 into `/not-found`                                                                                                                |
| `sitemap.xml`               | 302 into `/not-found` — so nothing points a crawler at `/library` or `/tournaments`                                                  |
| Any unknown path            | 302 to `/not-found`, which answers **200**: an unbounded supply of indexable soft 404s, per tenant                                   |
| `<html lang>`               | Hardcoded `en` while the app ships `pt`; no `hreflang` (this is 5d)                                                                  |
| `<h1>`                      | `/tournaments` and `/flea-market` have none                                                                                          |

### 7.1 Per-page metadata — done

`src/composables/useSeo.ts` is the one place that decides what a page says
about itself: title, description, canonical, `og:` and `twitter:`. `app.vue`
calls it once for the defaults every route inherits — the site's name as the
title, `og:site_name`, `og:image` from the edition poster — and a view with
something more specific to say calls it again and wins, because its setup runs
after `app.vue`'s.

| Page           | Title                     | Description                                             |
| -------------- | ------------------------- | ------------------------------------------------------- |
| `/`            | the edition's name        | the tenant's own edition description, if they wrote one |
| `/library`     | `Library · <edition>`     | from `public.library.seo`                               |
| `/tournaments` | `Tournaments · <edition>` | from `public.tournaments.seo`, with the live count      |
| `/flea-market` | the edition's name        | none — `noindex`, the page is an empty div              |
| `/checkout`    | the edition's name        | none — `noindex`, personal and empty to a crawler       |
| unknown URL    | `Page not found · …`      | none — `noindex`, and a 404 (7.3)                       |

Three things worth knowing before touching it:

- **The canonical is built from the request's own origin**, which is the only
  way it can be right when the same four routes are served on a domain per
  tenant. It uses `route.path`, not the full URL, so a query string does not
  fork a page into several.
- **Only a view sets a canonical, never `app.vue`.** An empty `link` array
  cannot retract one another call already added, so a `noindex` page could not
  drop it — `app.vue` passes `canonical: false` and each view opts in. The
  routes that call `useSeo` nowhere (admin, auth, `/users/:id`) get none, which
  is right: `robots.txt` disallows all three.
- **Nothing a head computed reads may be declared after a top-level `await`.**
  `HomeView`'s description reads the tournament count, and the fetch that fills
  it is awaited. During hydration unhead resolved the head while that await was
  still suspended, hit the `const` in its temporal dead zone, and rejected the
  component's whole setup. It surfaced as `$setup.t is not a function` and an
  undefined vnode, neither of which points anywhere near the cause. The fetch
  now sits above everything that reads it.

Two smaller notes. The composable reads the stores it captured during setup
rather than calling `useStore()` inside its computeds — a head computed is
evaluated after setup has returned, when there is no active Pinia: the same
trap as 4c and `plugins/tenant.ts`, one layer up again. And `NotFoundView` is
still hardcoded English, so its title is too.

### 7.2 `robots.txt` and `sitemap.xml` — done

Both are routes in `server/`, not files in `public/`, because the URL set is
per tenant and every URL in it has to name the host it was requested on.
`sitemap.xml` resolves the tenant from the request's `Host` the same way
`plugins/tenant.ts` does, lists `/` plus whichever of `/library` and
`/tournaments` that tenant has enabled, and answers 404 for a host nobody has
claimed. Verified against two real tenants on a build: one gets its library
only, the other gets both.

`/flea-market` is deliberately absent even when the feature is on, for the same
reason it says `noindex`: the page renders an empty div.

The awkward part is that **these routes cannot import the app's services**.
Nitro bundles `server/`, not Vite, so `import.meta.env` does not exist there
and the server tsconfig has no DOM for the `typeof window` checks in
`src/lib/supabase.ts` — importing `tenantService` fails to type-check before it
would fail to run. So `server/utils/supabase.ts` builds its own anonymous
client from `runtimeConfig`, and `sitemap.xml` repeats three narrow queries
that `tenantService`, `editionService` and `settingsService` already make. If
those tables change, this changes with them. It is in the debts below.

`scripts/check-tenant-isolation.mjs` now drives `/sitemap.xml` alongside `/`,
because the sitemap is the second place in the app that turns a host into
tenant data — and the only one that publishes the answer as a list of URLs.

### 7.3 A real 404 — done

`/not-found` is gone as a route. The catch-all renders `NotFoundView` at the
address that was asked for, and the view sets the response status. The status
has to be set by the component rather than the route because that is the only
place that knows a render is happening. Nothing linked to `/not-found` by name,
so a link to the old path now lands on the catch-all like any other unknown
URL.

### What is left

4. **JSON-LD** — `Event` for the edition, `ItemList` for the library and the
   tournaments. All of it is already in the stores at render time.
5. **`/library`'s other ~200 games.** Infinite scroll shows a crawler the first 20. Paginated routes with real links, or render the full list and paginate
   only the display.
6. **A home page title that says what the site is.** It is the edition's name
   and nothing else, which only helps somebody who already knows the event.
   There is no field for "board game convention in Maia" on the model —
   `landing.hero.defaultTitle` is the closest thing and it is a UI string, not
   per tenant.
7. **`og:image` shape.** It is the edition poster, which is portrait, on a
   `summary_large_image` card, which wants 1.91:1.

5d and 5e sit inside this too: `<html lang>` and `hreflang` are metadata, and
both are blocked on the i18n singleton.

## Debts to clear

| Item                                        | Where                                                                                              | When                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Remove the legacy session shim              | `migrateLegacySession()` in `src/lib/supabase.ts`, installed by `plugins/legacy-session.client.ts` | Once sessions in the wild have turned over                              |
| Remove the legacy locale shim               | `migrateLegacyLocale()` in `src/i18n/localePreference.ts`                                          | Same                                                                    |
| `createI18n` per request                    | `src/i18n/index.ts`                                                                                | Step 5e — blocks anything server-side setting a locale                  |
| `<html lang>` follows locale                | `app.head.htmlAttrs` in `nuxt.config.ts`                                                           | Step 5d                                                                 |
| `sitemap.xml` repeats three service queries | `server/routes/sitemap.xml.ts`                                                                     | When Nitro can import `src/lib/supabase.ts`, or the tables change       |
| Per-request Supabase client                 | `src/lib/supabase.ts`                                                                              | With checkout, not 5b — see 5b for why the public pages do not want one |
| `noUncheckedIndexedAccess`                  | `nuxt.config.ts`                                                                                   | Whenever; ~20 sites                                                     |
| Better Stack gets no server-side logs       | `src/lib/logger.ts`                                                                                | When server logs matter                                                 |
| ~~`/not-found` answers 200~~ — done         | `src/router/index.ts`                                                                              | Done — 7.3                                                              |

Both shims are cheap to keep and destructive to remove early — leaving them a
release or two longer costs nothing.

The **per-request Supabase client** was expected to land with 5b and did not.
The client in `src/lib/supabase.ts` is a module singleton, which on a server
means one object shared by every concurrent request. That is safe only because
the server build of it is deliberately stateless and anonymous: no session, no
refresh timer, nothing to carry from one visitor to the next. The cost is that
a server render is always signed out.

5b turned that cost into a feature. Everything the public views fetch during
render is the same for every visitor, so an anonymous client is the correct
one, and it is also the only one that lets 5a cache those renders. What still
needs a client built from the request's own cookies is checkout and the account
pages — views that are personal by nature, are not SEO surface, and must not be
cached. Building one for them is a smaller job than building one for everything,
and it should stay a per-request client rather than making this singleton
stateful.

**`noUncheckedIndexedAccess`** is turned off in `nuxt.config.ts`. Nuxt's
generated tsconfig turns it on and the SPA's did not, so adopting the generated
config wholesale failed on about twenty pre-existing unchecked array and record
accesses. Tightening those is worth doing and has nothing to do with rendering
on a server.

**`/not-found` answered 200** — fixed in 7.3. The catch-all used to redirect to
a route that rendered a not-found page with a success status, which a crawler
indexes happily. It was invisible in a SPA.

## Suggested order

1. ~~**4c** (services take explicit ids)~~ — shipped as #87.
2. ~~**4** version check, then scaffold + `Host`-header tenant resolution.~~
3. ~~**5b** `useAsyncData` in the public views~~ — done, and it did not need the
   per-request Supabase client after all.
4. ~~**7 items 1–3** metadata, `robots.txt`/`sitemap.xml`, a real 404~~ — done.
5. **5c/5d/5e** hydration, `lang`, i18n per request. What is left of 5c is two
   components that both want `<ClientOnly>`.
6. **5a** ISR windows — last, and only with the host in the cache key.
7. **7 items 4–7**, then **6** only if we want it.

5b moved ahead of 5a: caching a render that still fetches its content in the
browser caches an empty page. Step 7 then moved ahead of the rest of 5, for the
same reason one step further out — a page nothing links to and nothing
describes is a page that having rendered correctly does not help. Both moves
paid: 7.1 is also what turned up the temporal-dead-zone bug in `HomeView`,
which nothing else was going to find.

## How to verify

Type-check and build catch neither request-scoped state bugs nor hydration
mismatches. Step 4 is proof: it type-checked and built clean while handing one
visitor another tenant's Pinia.

**Concurrency.** `scripts/check-tenant-isolation.mjs` drives several tenant
hostnames at a running server at once and asserts that no response carries
another tenant's data, plus that an unknown host still answers 404 with
`DomainNotConfigured`. It found the bug described under step 4, and it is the
only check that could have. Since 7.2 it drives `/sitemap.xml` for the same
hosts in the same rounds — that route resolves a tenant by itself, and what it
publishes is a list of URLs. Not a CI test — it needs real hostnames and a real
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
auth and admin routes. Keep running it after anything that touches the head:
7.1's dead-zone bug reached the browser as a rejected setup promise and showed
up only there, while the page still server-rendered perfectly. Keep that habit, and extend it to assert on
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
