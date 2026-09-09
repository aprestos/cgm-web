import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

/**
 * Standalone since Nuxt took over the build: there is no `vite.config.ts` left
 * to spread in. The unit tests mount components directly, so they need the Vue
 * plugin and two aliases and nothing else Nuxt adds.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Nuxt's own alias for `shared/`, the one directory both the app and the
      // Nitro server can import. Nuxt sets it up in its builds; here it has to
      // be said out loud.
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
