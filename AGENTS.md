# AGENTS.md

## Snapshot

- Vue 3 + TypeScript + **Nuxt** app for a **multi-tenant board-game convention platform**. Public pages are server-rendered; `/admin` and `/auth` stay a SPA via `routeRules` in `nuxt.config.ts`. Tenant, current edition, and feature settings are resolved **before anything renders** by `src/plugins/tenant.ts`, and read broadly across the app.
- The app lives in `src/` (`srcDir`), not Nuxt's default `app/`. Use the `@` alias for it. Tooling expects **Node >= 22** and **pnpm >= 9** (`package.json`).
- `docs/ssr-migration.md` is the running record of the SSR move: what is done, what is left, and which debts it created. Read it before touching rendering, bootstrap or global state.

## High-value architecture

- The real app boundary is: **views/components → feature services → Supabase**. Most backend access lives in `src/features/**/service.ts`.
- Global state is **Pinia stores**, one instance per app: `src/features/tenant/tenant.store.ts`, `src/features/events/edition.store.ts`, `src/features/settings/useSettings.store.ts`, `src/features/cart/cart.store.ts`. They are request-scoped on purpose — a module-level ref would be shared by every concurrent render and leak one tenant's data into another's page.
- Bootstrap lives in `src/plugins/`, one plugin per concern (`tenant`, `i18n`, `vue-countdown`, and two `.client` ones). `plugins/tenant.ts` resolves the tenant from the request's `Host` header on the server and from `location.hostname` in the browser, then loads the current edition and settings. If you add code that depends on tenant/edition/settings, assume they are already loaded.
- **Anything running on the server must take its request context before its first `await`.** Pinia's active instance and Nuxt's current request are module globals that change at every suspension point, so `useSomeStore()` or `useRequestEvent()` called after an `await` can answer with another visitor's request. Capture them up front and pass them down — see `src/plugins/tenant.ts`.
- Routing is split by audience in `src/router/index.ts`, which exports a plain route table; `src/router.options.ts` hands it to Nuxt instead of a `pages/` directory. Admin access is enforced with route `meta.guard`/`meta.requiresAuth`, helpers in `src/router/guards.ts`, and the global middleware in `src/middleware/auth.global.ts`.

## Data and service patterns

- The app is **tenant-aware** everywhere, and services take `tenantId`/`editionId` as **explicit parameters** (example: `src/features/tickets/service.ts`). Do not reach for a store from inside a service: on a server that reads whichever Pinia is active at that moment, which is not necessarily the request the call started in.
- `src/lib/supabase.ts` exports one client that is a cookie-backed browser client in the browser and a **stateless, anonymous** client on the server. A server render is therefore always signed out; anything that needs the visitor's session while rendering needs a per-request client first.
- Supabase table/edge-function access is the norm. Examples:
  - auth OTP + claims: `src/features/auth/service.ts`
  - tenant lookup by domain / fallback to `VITE_DEV_TENANT_ID`: `src/features/tenant/service.ts`
  - current edition: `src/features/events/service.ts`
  - settings flags: `src/features/settings/service.ts`
- Keep **camelCase in app code** and convert at the service boundary when needed using `toCamelCaseAs` / `toSnakeCaseAs` from `src/utils/caseConverter.ts`. `src/features/tickets/service.ts` is the cleanest example.
- Logging goes through `src/lib/logger.ts`, which enriches logs with tenant context and only sends to Better Stack outside development.

## UI patterns worth copying

- Use `<script setup lang="ts">` and typed refs/props/emits throughout. ESLint is strict about this (`eslint.config.ts`).
- Reusable field components already carry the project’s validation/error display style; prefer them over raw inputs. Example: `src/components/CInput.vue` + `src/components/ValidationErrors.vue`.
- Form validation uses **Regle** in feature views (`useRegle` + `@regle/rules`), e.g. `src/views/admin/settings/organization/BasicInformation.vue`.
- Settings pages often compose multiple child forms and trigger saves through `defineExpose({ save, isSaving })`, then aggregate with `SettingsBottomBar`. See `src/views/admin/settings/organization/OrganizationSettings.vue`.
- Feature flags from `useSettingsStore()` drive navigation visibility. `src/views/admin/HomeView.vue` filters admin/public nav items based on `settingsStore.settings?.<feature>.enabled`.
- File uploads go through `src/components/FilePondUploadDialog.vue` and `src/utils/fileUpload.ts`; uploads require an authenticated user and a caller-supplied Supabase bucket/path.

## Auth / navigation specifics

- Sign-in is **email OTP**, not password-first UI. Flow lives in `src/views/auth/SignInView.vue` and `src/features/auth/service.ts`.
- `authService.getUser()` derives access from Supabase JWT claims and indexes tenant-specific roles by the current tenant id. Role checks should reuse `authService.hasAnyOfTheRoles()` or router guards.
- Route names are centralized in `src/router/routeNames.ts`; use them instead of hardcoded strings.

## i18n and theming

- i18n auto-loads locale files from `src/i18n/locales/*.ts`; add a new file there and update `LOCALE_NAMES` in `src/i18n/index.ts`.
- Whenever you add a new UI label/text key, add translations for all supported locales in `src/i18n/locales/*` in the same change.
- Tailwind is the primary styling path; dark mode is used widely. Prefer existing component patterns over custom CSS.

## Verified workflows

- Install: `pnpm install` (runs `nuxt prepare`, which generates `.nuxt/` — lint and type-check need it)
- Dev server: `pnpm run dev` (Nuxt, https with a self-signed certificate)
- Type-check: `pnpm run type-check` (`nuxt typecheck`)
- Lint: `pnpm run lint` (`lint:oxlint` + `lint:eslint`)
- Unit tests: `pnpm run test:unit` (Vitest + jsdom; see `vitest.config.ts`)
- E2E: `pnpm run test:e2e` (Playwright starts `npm run dev` locally on https://localhost:3000 and `npm run preview` on CI; see `playwright.config.ts`)
- Build: `pnpm run build` (Nitro output in `.output/`; preview with `node .output/server/index.mjs`)
- Multi-tenant isolation: `pnpm run check:tenant-isolation` against a running build — see `docs/ssr-migration.md`

## Practical cautions for agents

- Read `src/plugins/tenant.ts` before changing tenant-, edition-, or settings-dependent code; those stores are foundational.
- Browser globals (`window`, `document`, `localStorage`, `navigator`) are not there during a render. Guard them, put the code in `onMounted`, use a `.client.ts` plugin, or wrap the component in `<ClientOnly>`.
- Do not assume all Supabase rows match frontend naming; inspect the service first for snake_case/camelCase handling.
- Services take ids explicitly; read the surrounding feature before adding a parameter, and never add one that reads a store internally.
- The current `e2e/vue.spec.ts` is still the default scaffold-style test, so treat Playwright coverage as minimal until you inspect/update it.
