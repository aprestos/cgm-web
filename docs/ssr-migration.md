# SSR migration

Tracks the move from a client-rendered SPA to server-rendered public pages.

Every step is done. Step 7 was added along the way, after 5b showed that
rendering the content on a server is only half of what the SEO reason for this
migration needed. Everything below step 7 is a debt this migration created or
uncovered, recorded so it does not get lost.

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
| 5c–5e. Hydration, locale | —   | Every public route now hydrates with zero console errors. i18n is one instance per app, the language is resolved per request, and `<html lang>` follows it.                                          |
| 5a. Caching              | —   | The public pages are cached per tenant and per language, 359ms down to 2ms. Not with `isr`, which cannot key by host and would have served one tenant's pages to another.                            |
| 7.4–7.7. The rest of SEO | —   | Structured data on the three public pages, a URL per twenty games, a home title that says what the site is, and a link preview that is not a cropped poster.                                         |
| 6. File-based routing    | —   | The hand-written route table is gone; 35 route components live in `pages/` and `layouts/` and Nuxt scans them. Same URLs, same names, same guards.                                                   |

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

### 5a. Route rules and caching (done)

The plan here was `isr: 60` on the four public paths. **That would have served
one tenant's pages to every other tenant**, and the shape of the fix is not the
shape the plan assumed.

#### Why not `isr`

`isr` is not a Nitro feature; it is a Vercel one. Nitro's Vercel preset turns
`isr: 60` into a `.prerender-config.json` next to the function, and the only
key Vercel's ISR cache has is the **path**, plus whatever `allowQuery` lists.
There is no way to add a header to it. The function still receives the real
`Host` — it renders the right tenant perfectly — and then the result is filed
under `/library` and handed to the next domain that asks. Silent, correct on
the first request, wrong from the second.

For an app that serves the same four paths on a domain per tenant, `isr` is
therefore unusable, and no window length makes it safe.

#### What is there instead

`cache`, which is Nitro's own, works on every preset, and whose key is ours:

```ts
const publicPage = {
  cache: { maxAge: 60, varies: ['host', 'x-forwarded-host', 'x-app-locale'] },
  headers: { vary: 'accept-language, cookie' },
}
```

applied to `/`, `/library` and `/tournaments`. Not `/flea-market`: it renders
an empty div, so there is nothing to save.

**`varies` does two jobs, and the second one is the surprise.** It decides the
cache key, and it is also the complete set of request headers the render is
allowed to see — `defineCachedEventHandler` rebuilds the request with only
those. A rule without it does not leak; it **breaks**. Measured, with
`cache: { maxAge: 60 }` and nothing else on `/library`: every tenant got

```
404  This domain is not connected
```

because the render could not read its own `Host`. That is a genuinely useful
property — with `cache`, forgetting something from the key fails loudly on the
first request instead of leaking on the second, which is exactly backwards from
how `isr` fails.

#### The language, and why a middleware

The key needs the language too, since 5e made a render come out in the language
that was asked for. Neither of the two headers that decide it can be keyed on:

- **`cookie`** carries the visitor's session, so every signed-in visitor would
  get a private copy of the same anonymous page, and the key would grow without
  bound.
- **`accept-language`** is a free-form ranked list — `en-US,en;q=0.9,pt;q=0.8`
  — with a different spelling in every browser, so it is nearly as unbounded.

`server/middleware/locale.ts` resolves both down to one of the two languages we
have and puts the answer in `x-app-locale` before anything else runs. The key
becomes (path, host, language): bounded, and unforgeable, since only known
language codes pass through. `plugins/i18n.ts` reads that header on the server
instead of the cookie.

The side effect is the useful part: **a cached render cannot see a session
cookie at all.** The precondition that these renders stay anonymous — 5b's
reason for leaving the personal parts of each page in the browser — is now
structural rather than a promise. (`/checkout` is `ssr: false` for the stronger
version of the same reason, so it is not a candidate for caching either.)

`headers: { vary: 'accept-language, cookie' }` is for anything caching in front
of us. Nitro answers `cache-control: max-age=60`, and a shared cache taking
that at face value would have no idea the body depends on the language —
`x-app-locale` is ours, invented after the request arrived, and no CDN has seen
it. Naming `cookie` there also means most shared caches decline to store the
response at all, which is the outcome we want: the only cache that knows the
right key is this one.

#### What it bought

Measured against a build, warm process, per (host, language) key:

| Route          | Cold   | Warm  |
| -------------- | ------ | ----- |
| `/`            | 359ms  | 2.3ms |
| `/tournaments` | 321ms  | 1.6ms |
| `/library`     | ~400ms | 1.1ms |

The cold figures are the three-round-trip bootstrap plus the render; they are
what every request used to cost.

60s is still a starting guess. `/library` is the one to watch — game
availability changes during a convention — but a stale list corrects itself
right after hydration, because the browser subscribes to the same data in
realtime.

#### How this is checked

`scripts/check-tenant-isolation.mjs` now drives every (host × path × language)
combination concurrently, for 15 rounds, and asserts each response names its
own tenant, is in the language that was asked for, and contains no other
tenant's name. **The rounds are the point**: a bad key is correct on the first
request for it and wrong on every one after, so a single pass over each
combination finds nothing.

It was checked against a deliberately wrong key — `varies` with the host
removed — and failed on every combination, which is the only evidence that it
would catch a real one.

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

### 5c. Hydration mismatches (done)

Every public route — `/`, `/library`, `/tournaments`, `/flea-market`,
`/checkout` — now hydrates with **zero console errors or warnings**, for a
fresh browser and for a returning one carrying a cart and a checkout draft.

What each one turned out to be:

- **`LanguageSwitcher`'s headless-ui `Listbox`** — on every public page.
  Different ids and different popover markup on the two sides. `<ClientOnly>`,
  with a fallback that draws the same trigger button so the header does not
  shift when the real one takes over. The fallback can name the current
  language honestly, because after 5e the server knows which one it is.
- **`FilterSidebar`** on `/library` and `/tournaments` — `useMinWidth` answers
  false with no browser, so the server rendered the slide-over and a desktop
  browser replaced it with the pinned `<aside>`. `<ClientOnly>` inside the
  component, deliberately with no fallback: guessing a viewport server-side
  only trades a mismatch for a flash of the wrong layout.
- ~~**A date range in `HeroView`**~~ — fixed in the 5b/step 7 pass, and it was
  not what this file said it was. The two strings differ by their separator,
  not their date: `Intl.DateTimeFormat.formatRange` pads the en dash with
  whatever the runtime's ICU decides, and Node 26 picks U+2009 THIN SPACE where
  Chrome picks a plain U+0020. The same instant, formatted by two different ICU
  builds. `formatDateRange` in `src/utils/date.ts` no longer calls the native
  `formatRange`; it goes through the Luxon path that used to be only a
  fallback, with a separator we own. That also removed a zone bug nobody had
  noticed: the native path read its ends through `new Date`, which parses a
  date-only ISO string as UTC midnight and then prints it locally, so
  `2026-12-28` was already December 27th for anyone west of Greenwich.

And the two that were predicted here, of which **only one was real**:

- **The cart was real.** `useCart()` calls `initialize()` during setup, which
  reads localStorage synchronously, so a returning visitor's _first_ client
  render already had a cart the server's HTML did not. It showed up twice on
  `/`: the badge in `HeaderComponent` and the checkout bar in `TicketsView`.
  Both are `<ClientOnly>` now. Neither is content — they are controls that mean
  nothing to a visitor without a cart.
- **The checkout draft was not.** `restoreDraft()` is called from `onMounted`,
  which runs _after_ the first client render, so the browser's first render
  agrees with the server's and the restore lands as an ordinary reactive
  update. Nothing to fix. The distinction is the whole lesson: **restoring
  browser state during setup mismatches, restoring it in `onMounted` does
  not.**

`/checkout` is `ssr: false` now rather than patched with `<ClientOnly>`.
Checkout _is_ the cart, and the cart lives in the browser: a server render is
always the empty-cart page, so nearly every element on it disagreed with the
browser's first render. It is `noindex` anyway. That is the same one-line
answer `/admin` and `/auth` already had.

Anything branching on `useBreakpoint` / `useMediaQuery` is the `FilterSidebar`
shape: both correctly answer `false` with no browser, so the server renders the
mobile branch and the client may swap it. It only matters where the two layouts
must not coexist, which is exactly what those composables are for.

Most of the codebase was already fine: only 28 of ~265 source files touch
browser globals, and the scroll handlers in `PageLanding.vue`,
`BaseLandingPage.vue` and `HeaderComponent.vue` are all inside
`onMounted`/`onUnmounted`, which never run on a server.

### 5d. `<html lang>` (done)

`src/app.vue` sets it from the language the request resolved to, reactively, so
switching language in the page updates it too. It was a static `en` in
`nuxt.config.ts`, which in a SPA nobody could see — the shell had no text in
it. On a server-rendered page it is a claim about content that is right there
in the response, and it was wrong for every Portuguese visitor.

**No `hreflang`, on purpose.** `hreflang` annotates _alternate URLs_ for the
same content in other languages, and this app has none: the language is a
cookie and a header, and `/library` is one URL that answers in whichever
language the visitor asked for. Adding `hreflang` would mean per-locale URLs
(`/pt/library`), which is a routing decision, not a metadata one. What the
current shape does want is `Vary: accept-language` on the cached responses —
see the warning in 5a.

### 5e. i18n per request (done)

`createI18n()` no longer runs at module scope. `src/i18n/index.ts` exports
`createAppI18n(locale)` and `plugins/i18n.ts` calls it once per app, which on a
server is once per request.

The language for a request is resolved in that plugin, in this order: the
`app-locale` cookie, then a legacy localStorage preference (browser only, the
shim from #83), then what the visitor's browser asks for — `Accept-Language` on
a server, `navigator` in a browser, which are the same preference reported
through two different channels. The answer is kept in `useState`, so the
server's decision rides to the browser in the payload and hydration starts from
the language the server actually rendered rather than working it out again and
possibly disagreeing.

**The consequence is bigger than `<html lang>`.** Until this, every server
render came out in English regardless of who asked, and the visitor's language
was applied on hydration — a mismatch on every translated string on the page,
and English HTML for a crawler no matter which language the page is really in.
A Portuguese request now gets `<title>Ludoteca · …</title>` from the server.

One module had to change with it. `getStatusLabel` in
`features/library/games/game.model.ts` read `i18n.global` off the shared
instance; there is no shared instance to read now, and had there been one it
would have answered in whichever request's language happened to be current. It
takes `t` as a parameter — the same fix the services got in 4c.

## Step 6 — File-based routing (done)

The hand-written table in `src/router/index.ts` is gone. Thirty-five route
components moved into `src/pages/` and `src/layouts/`, and Nuxt scans them.
Nothing about the app's behaviour changed: the same URLs, the same route names,
the same guards.

The ~140 components those pages are built from stayed in `src/views/`. Only the
files that were _routes_ moved, which is what makes this a diff somebody can
read rather than a wholesale rename.

### The one shape a scanned tree cannot express

The old table had **two sibling parents both matching `path: ''`** —
`BaseLandingPage` holding `/` and `/checkout`, `BasePublicPage` holding
`/library`, `/tournaments` and `/flea-market`. A directory cannot be two
things, so those two became **layouts**, named per page with
`definePageMeta({ layout })`. `app.vue` wraps `<NuxtPage>` in `<NuxtLayout>` for
that to mean anything, and there is deliberately no `layouts/default.vue`: the
admin, auth and 404 pages render bare, exactly as they did.

`/auth` and `/admin` did _not_ become layouts. Their chrome was a parent route
component with children under it, and `pages/auth.vue` + `pages/auth/*.vue` is
the same shape — which matters for `/admin`, because a parent route is
something meta can be attached to and a layout is not.

`/checkout` had been declared twice, once under each of those parents, with two
names. Only `landing.checkout` was ever navigated to; `public.checkout` is
deleted.

### Route names survived, which is why nothing else had to change

Every `router.push({ name })` in the app depends on the names in
`routeNames.ts`. `definePageMeta({ name: RouteNames.public.library })` keeps
them — the macro is extracted at build time but it resolves imported constants,
which was the first thing checked and the one answer that would have made this
step not worth doing. Verified afterwards by walking every route in a browser
and reading `$router.currentRoute.name` back.

### Guards became middleware, because a macro cannot hold a function

`/admin` carried `meta.requiresAuth` and `meta.guard: () => hasAnyOfRoles([...])`,
and `/admin/settings` a `beforeEnter`. `definePageMeta` is extracted at build
time and cannot carry a function, so both became named middleware —
`src/middleware/admin.ts` and `admin-settings.ts` — declared on the parent
pages. **Nuxt collects middleware from every matched record**, so declaring
`admin` on `pages/admin.vue` covers everything under it, and `/admin/settings`
runs both.

That retired `middleware/auth.global.ts` and the `navigationGuard` in
`router/guards.ts`, which existed to read `meta.guard` off the table. What is
left in that file is the two questions themselves, `requiresAuth` and
`hasAnyOfRoles`.

### A bug this turned up

The old guard sent an unauthorised visitor to `{ name: RouteNames.error.notFound }`.
That was fine until 7.3 made the not-found route the **catch-all** — after
which resolving that name with no `pathMatch` param produces `/`, so somebody
without the role was quietly sent to the landing page instead of a 404. It had
never shown, because every guarded route is behind a login and client-rendered.

The middleware throws a 404 now, and `src/error.vue` renders it with the same
not-found page an unknown URL gets — the markup moved to
`components/NotFoundContent.vue` so both use one copy. Adding `error.vue` also
means a thrown error stops falling through to Nuxt's own error screen, which is
a different design and a different language from the rest of the app.

### Also

- `vue/multi-word-component-names` is off for `pages/`, `layouts/`, `app.vue`
  and `error.vue`. Those filenames _are_ the route, the layout or the framework
  hook; components still have to obey the rule.
- `router.options.ts` keeps `scrollBehavior` and nothing else.
- `admin.dashboard` is still in `routeNames.ts` and still names no route. It is
  referenced by one nav entry that is permanently `enabled: false`.

### Was it worth it?

The plan said "only if we want Nuxt's conventions throughout", and that is
still the honest answer. Nothing here fixed a user-visible problem; the routing
worked. What it bought is that a route is now a file where you would look for
it, guards are middleware rather than functions smuggled through route meta,
and there is no second place where routes have to be registered.

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

### 7.4 Structured data — done

`src/composables/useJsonLd.ts`, and three callers. The landing page describes
its edition as an `Event` — dates, venue, organiser, and an `Offer` per ticket
— which is one of the few things a result page will render specially. The
library and the tournaments are each an `ItemList`.

Two decisions worth keeping:

- **Nothing is emitted from incomplete data.** No start date, no `Event`; no
  games, no `ItemList`. A card with holes in it is worse than no card, and the
  getter answering `null` is how a page says so.
- **The JSON is escaped before it goes in the page.** A tenant writes their own
  edition description, and a `</script>` in it would close the block early and
  spill the rest of the JSON into the document as markup. `<`, `>` and `&`
  become their `\u` escapes, which are still the same string to a parser.

The `Place` carries a name and a map link, because a name is all an edition
stores — there is no structured address to give. Library items carry no `url`:
opening a game is a dialog, not a page.

### 7.5 A URL per twenty games — done

`/library?page=N` renders that window on the server, and a row of real links at
the bottom of the list is how a crawler reaches them. Infinite scroll still
works exactly as before for a person: the page they land on is the start of the
list and scrolling appends to it. Only the starting point changed.

Three things had to go with it:

- **The canonical has to keep `?page`.** Without it every page of the library
  would name page one as the real version, and a search engine would drop the
  other four. `useSeo` takes a `canonicalQuery` allow-list — one parameter,
  because anything else would fork the library into copies of itself.
- **The title carries the page number**, so the five pages are not five
  identical entries in a results list.
- **The `ItemList` counts positions from the start of the library**, not from
  the top of the page: `?page=3` emits positions 41–60. The numbering is what
  says these pages are one list in sequence.

The fetch moved into `useLibraryGames`, shared by `PageLibraryHome` and
`GameList` through one `useAsyncData` key, because both need it now — the page
counts the games for its title, its structured data and its links, and the list
draws them. That also let the library's description say how many games there
are, which 7.1 had left out for want of a count.

The pagination renders one link per page, which is fine at five and would not
be at fifty. If a tenant's library ever gets that big it wants a window with
gaps in it.

### 7.6 A home title that says what the site is — done

`Maia Kidult Weekend · Board Game Convention`. The name first, because that is
what somebody who already knows the event searches for; the tagline second, for
everybody else. It comes from `landing.hero.defaultTitle`, which is already the
phrase shown to a visitor when a tenant has written nothing of their own.

Still second best. A field on the tenant would let each of them say what they
actually are, and the ones that are not board game conventions would stop being
described as one.

### 7.7 A link preview that is not a cropped poster — done

`og:image` prefers a photo from `tenant.images` — the gallery on the landing
page — over the edition poster, and `twitter:card` drops to `summary` when the
poster is all there is. A preview card is a wide letterbox and a poster is
portrait, so a poster in one is cropped to a band across its middle; the small
square card is not a worse preview than that, it is a better one, because the
whole image survives.

Neither image is measured. We cannot know the proportions of a URL, so this is
an assumption about what each field is _for_, and the card type hedges it.

### What 7.4–7.7 found in 5a

**Nuxt was serving the payload from a different render than the HTML.**
`payloadExtraction` is on by default and applies to any route Nuxt considers
cacheable, which the rules from 5a had just made all three public pages. Those
pages then shipped `data-src="/_payload.json"`, and the browser fetched the
payload from a separate — and uncached — render.

It showed on the landing page, which picks thirteen games at random: the HTML
said one set, the payload said another, and hydration replaced every card. Any
render that is not a pure function of the cache key would have done the same.
The quieter half is that every hydration of a cached page was triggering a full
server render to fetch its payload, which is most of the work the cache exists
to avoid.

`experimental.payloadExtraction: false` puts the payload back in the response
the cache stored, so it describes exactly the HTML it arrived with. Confirmed
both ways against a build: on, `/` reports mismatches cold and warm; off, every
public route reports nothing.

It is worth knowing how this got through 5a. That step was verified with curl
and `check:tenant-isolation`, both of which only ever read the server's HTML —
and the server's HTML was right. It took a browser to see that the page
disagreed with itself after hydration.

## Debts to clear

| Item                                          | Where                                                                                              | When                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Remove the legacy session shim                | `migrateLegacySession()` in `src/lib/supabase.ts`, installed by `plugins/legacy-session.client.ts` | Once sessions in the wild have turned over                              |
| Remove the legacy locale shim                 | `migrateLegacyLocale()` in `src/i18n/localePreference.ts`                                          | Same                                                                    |
| `server/` repeats things `src/` already knows | `server/routes/sitemap.xml.ts`, `server/utils/locales.ts`, `server/middleware/locale.ts`           | When Nitro can import `src/lib/supabase.ts`, or the tables change       |
| Per-request Supabase client                   | `src/lib/supabase.ts`                                                                              | With checkout, not 5b — see 5b for why the public pages do not want one |
| `noUncheckedIndexedAccess`                    | `nuxt.config.ts`                                                                                   | Whenever; ~20 sites                                                     |
| Better Stack gets no server-side logs         | `src/lib/logger.ts`                                                                                | When server logs matter                                                 |
| ~~`/not-found` answers 200~~ — done           | `src/router/index.ts`                                                                              | Done — 7.3                                                              |

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
5. ~~**5c/5d/5e** hydration, `lang`, i18n per request~~ — done.
6. ~~**5a** caching~~ — done, and not with `isr`; see the step for why.
7. ~~**7 items 4–7**~~ — done. ~~**6**~~ — done too.

5b moved ahead of 5a: caching a render that still fetches its content in the
browser caches an empty page. Step 7 then moved ahead of the rest of 5, for the
same reason one step further out — a page nothing links to and nothing
describes is a page that having rendered correctly does not help. Both moves
paid: 7.1 is also what turned up the temporal-dead-zone bug in `HomeView`,
which nothing else was going to find, and 5e turned out to matter more for SEO
than 5d did — every server render had been coming out in English regardless of
who asked.

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
publishes is a list of URLs. Since 5a it also drives every (host × path ×
language) combination against the cached routes, because a cache key is a
second, quieter way to hand one visitor another's page. Not a CI test — it needs real hostnames and a real
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
up only there, while the page still server-rendered perfectly.

**Run it after anything that changes how a page is delivered, not only what it
contains.** 5a passed curl and `check:tenant-isolation` while serving a payload
from a different render than the HTML; both of those read only the server's
HTML, and the server's HTML was right. It took a browser to see the page
disagree with itself.

Run it **twice** — once with a fresh browser and once with a returning one.
5c's real mismatches were only visible to a browser that already had a cart in
localStorage; a fresh one agreed with the server perfectly and reported
nothing. Seeding `congremio:cart:v1` before the second pass is what found them:

```js
localStorage.setItem(
  'congremio:cart:v1',
  JSON.stringify({
    cartId: null,
    items: [
      {
        ticket: { id: 1, name: 'x', price: 1000, status: 'active' },
        quantity: 2,
      },
    ],
  }),
)
```

Worth a pass with `Accept-Language: pt` and with an `app-locale=pt` cookie too,
now that the language changes what the server renders. Keep that habit, and extend it to assert on
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
