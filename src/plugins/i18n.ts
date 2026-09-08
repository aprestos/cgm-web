import i18n from '@/i18n'

/**
 * Installs vue-i18n, which `src/main.ts` used to do.
 *
 * The instance is still created once at module scope, which means every
 * concurrent server render shares it. That is safe only because nothing on the
 * server writes to it: the locale is read, never set, so all server renders
 * come out in the default language and the visitor's own choice is applied on
 * hydration. Making `createI18n` per request is step 5e of
 * `docs/ssr-migration.md`, and it has to happen before anything server-side
 * sets a locale.
 */
export default defineNuxtPlugin({
  name: 'i18n',
  setup(nuxtApp) {
    nuxtApp.vueApp.use(i18n)
  },
})
