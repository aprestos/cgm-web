/**
 * Matches a Tailwind breakpoint from JavaScript, reading the width out of the
 * compiled theme rather than repeating it. See the `@theme static` block in
 * `src/index.css` for why the variables are emitted at all.
 *
 * Only for the cases `useMediaQuery` is meant for — a layout that must exist in
 * one form or the other, never both. Anything purely visual belongs in a `md:`
 * utility.
 */

import { readonly, ref, type Ref } from 'vue'

import { useMediaQuery } from '@/composables/useMediaQuery.ts'

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * The `min-width` query for a breakpoint, or null when the theme variable is
 * missing — a stylesheet that has not loaded yet, or a build that dropped it.
 */
function breakpointQuery(name: Breakpoint): string | null {
  if (typeof window === 'undefined') return null

  const width = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(`--breakpoint-${name}`)
    .trim()

  if (!width) {
    if (import.meta.env.DEV)
      console.warn(
        `[useBreakpoint] --breakpoint-${name} is not defined. Is it still in the @theme static block in src/index.css?`,
      )
    return null
  }

  return `(min-width: ${width})`
}

/**
 * True from `name` up. An undefined breakpoint never matches, so a caller with
 * an optional prop can pass it straight through.
 */
export function useMinWidth(
  name: Breakpoint | undefined,
): Readonly<Ref<boolean>> {
  const query = name ? breakpointQuery(name) : null

  // No query to watch: the answer is false and stays false, so skip the
  // listener rather than feeding matchMedia something it cannot parse.
  if (!query) return readonly(ref(false))

  return useMediaQuery(query)
}
