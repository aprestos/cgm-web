/**
 * Blocks pinch-to-zoom, which used to be an inline `<script>` in `index.html`.
 *
 * The app is used one-handed on a phone at a convention door; a stray
 * two-finger drag zooming the check-in screen is a support call.
 */
export default defineNuxtPlugin({
  name: 'pinch-zoom',
  setup() {
    document.addEventListener(
      'touchmove',
      (event) => {
        if (event.touches.length > 1) event.preventDefault()
      },
      { passive: false },
    )
  },
})
