# AGENTS.md

## Snapshot
- Vue 3 + TypeScript + Vite app for a **multi-tenant board-game convention platform**. Tenant, current edition, and feature settings are loaded **before mount** in `src/main.ts` and then read broadly across the app.
- Use the `@` alias for `src/` (see `vite.config.ts`). Tooling expects **Node >= 22** and **pnpm >= 9** (`package.json`).

## High-value architecture
- The real app boundary is: **views/components → feature services → Supabase**. Most backend access lives in `src/features/**/service.ts`.
- Global state is currently mostly **module-level refs**, not `defineStore()`: see `src/stores/tenant.ts`, `src/stores/edition.ts`, `src/features/settings/useSettings.store.ts`.
- `src/main.ts` bootstraps in this order: load tenant from local storage/domain → load current edition → load settings → install Pinia/router/i18n/head → mount. If you add code that depends on tenant/edition/settings, assume these refs are preloaded on normal startup.
- Routing is split by audience in `src/router/index.ts`: public pages, `/auth`, and `/admin`. Admin access is enforced with route `meta.guard`/`meta.requiresAuth` and helpers in `src/router/guards.ts`.

## Data and service patterns
- The app is **tenant-aware** everywhere. Many services filter by `tenantStore.value?.id` and `editionStore.value?.id` implicitly (example: `src/features/library/locations/service.ts`), while others take ids explicitly (example: `src/features/tickets/service.ts`). Match the surrounding feature’s style instead of inventing a third one.
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
- Feature flags from `settingsStore` drive navigation visibility. `src/views/admin/HomeView.vue` filters admin/public nav items based on `settingsStore.value?.<feature>.enabled`.
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
- Install: `pnpm install`
- Dev server: `pnpm run dev`
- Type-check: `pnpm run type-check`
- Lint: `pnpm run lint` (`lint:oxlint` + `lint:eslint`)
- Unit tests: `pnpm run test:unit` (Vitest + jsdom; see `vitest.config.ts`)
- E2E: `pnpm run test:e2e` (Playwright starts `npm run dev` locally and `npm run preview` on CI; see `playwright.config.ts`)
- Build: `pnpm run build`

## Practical cautions for agents
- Read `src/main.ts` before changing tenant-, edition-, or settings-dependent code; those refs are foundational.
- Do not assume all Supabase rows match frontend naming; inspect the service first for snake_case/camelCase handling.
- Check whether a feature already depends on global refs before adding new service parameters.
- The current `e2e/vue.spec.ts` is still the default scaffold-style test, so treat Playwright coverage as minimal until you inspect/update it.

