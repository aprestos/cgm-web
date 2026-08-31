/**
 * Reactive `matchMedia`, so a component can render one layout or the other
 * rather than shipping both to the DOM and hiding one with CSS. Worth the
 * JavaScript only when the two layouts must not coexist — duplicated form
 * controls and ids, for instance.
 */

import { onScopeDispose, readonly, ref, type Ref } from 'vue'

export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref<boolean>(false)

  if (typeof window === 'undefined' || !window.matchMedia)
    return readonly(matches)

  const media = window.matchMedia(query)
  matches.value = media.matches

  const update = (event: MediaQueryListEvent): void => {
    matches.value = event.matches
  }

  media.addEventListener('change', update)
  onScopeDispose(() => media.removeEventListener('change', update))

  return readonly(matches)
}
