import { ref } from 'vue'
import type { Edition } from '@/features/events/edition.model.ts'

export const editionStore = ref<Edition | null>(null)
