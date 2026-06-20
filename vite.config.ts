import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueJsx(),
    vueDevTools({ componentInspector: false }),
    basicSsl(),
  ],
  server: {
    host: process.env.VITE_DEV_HOST === 'true',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Use esbuild for faster builds
    minify: 'esbuild',
  },
})
