import VueCountdown from '@chenfengyuan/vue-countdown'

/** The one globally registered component, carried over from `src/main.ts`. */
export default defineNuxtPlugin({
  name: 'vue-countdown',
  setup(nuxtApp) {
    nuxtApp.vueApp.component(VueCountdown.name as string, VueCountdown)
  },
})
