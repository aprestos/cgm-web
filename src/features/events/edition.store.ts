import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Edition } from '@/features/events/edition.model.ts'

/**
 * The edition currently being shown for the active tenant.
 *
 * Request-scoped for the same reason as the tenant store: on a server a
 * module-level ref is shared across concurrent renders.
 */
export const useEditionStore = defineStore('edition', () => {
  const edition = ref<Edition | null>(null)

  /**
   * The currency prices are shown in, defaulting until an edition is loaded.
   *
   * Formatting a price needs a currency, and an edition can be absent or
   * saved without one, so the fallback lives here rather than at every
   * call site that formats a price.
   */
  const currency = computed(() => edition.value?.currency ?? 'EUR')

  return { edition, currency }
})
