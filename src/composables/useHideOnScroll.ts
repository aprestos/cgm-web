/**
 * Hides an element while the user scrolls down and brings it back as soon as
 * they scroll up — the usual auto-hiding header.
 *
 * CSS almost covers this on its own: a scroll-state container query reacts to
 * scroll direction with no JavaScript at all. It was Chromium-only when this
 * was written, hence the listener below.
 *
 * TODO: re-check https://caniuse.com/css-scroll-state — once Firefox and
 * Safari ship it, this composable can go away in favour of:
 *
 *   body   { container-type: scroll-state }
 *   header { position: sticky; top: 0; transition: transform .3s }
 *   @container scroll-state(scroll-direction: down) {
 *     header { transform: translateY(-100%) }
 *   }
 */

import { onScopeDispose, readonly, ref, type Ref } from 'vue'

/** Scroll movement below this many pixels is jitter, not intent. */
const MIN_DELTA = 4

/**
 * @param threshold How far down the page the user must be before the element
 *   is allowed to hide, so it stays put while they are still near the top.
 */
export function useHideOnScroll(threshold = 80): Readonly<Ref<boolean>> {
  const isHidden = ref<boolean>(false)

  if (typeof window === 'undefined') return readonly(isHidden)

  let lastY = window.scrollY
  let ticking = false

  const update = (): void => {
    ticking = false
    const y = window.scrollY

    // Near the top the element is always visible, whichever way we are going.
    if (y <= threshold) {
      isHidden.value = false
      lastY = y
      return
    }

    // Keep `lastY` where it is so small movements accumulate rather than
    // flipping the element back and forth.
    const delta = y - lastY
    if (Math.abs(delta) < MIN_DELTA) return

    isHidden.value = delta > 0
    lastY = y
  }

  const onScroll = (): void => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScopeDispose(() => window.removeEventListener('scroll', onScroll))

  return readonly(isHidden)
}
