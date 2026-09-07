import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Edition } from '@/features/events/edition.model.ts'

/**
 * The edition currently being shown for the active tenant.
 *
 * Request-scoped for the same reason as the tenant store: on a server a
 * module-level ref is shared across concurrent renders.
 */
export const useEditionStore = defineStore('edition', () => {
  const edition = ref<Edition | null>(null)

  return { edition }
})
