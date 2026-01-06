<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  sections: string[]
  activeSection: string
}

interface Emits {
  (e: 'scrollTo', section: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Section name labels mapping to translation keys
const sectionTranslationKeys: Record<string, string> = {
  hero: 'landing.nav.home',
  gallery: 'landing.nav.gallery',
  map: 'landing.nav.location',
  tickets: 'landing.nav.tickets',
  countdown: 'landing.nav.countdown',
  features: 'landing.nav.features',
  games: 'landing.nav.games',
}

function getSectionLabel(section: string): string {
  const key = sectionTranslationKeys[section]
  if (key) {
    return t(key)
  }
  return section.charAt(0).toUpperCase() + section.slice(1)
}
</script>

<template>
  <nav
    class="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 lg:flex"
  >
    <button
      v-for="section in sections"
      :key="section"
      class="group relative flex items-center justify-end"
      :aria-label="`Scroll to ${getSectionLabel(section)}`"
      @click="emit('scrollTo', section)"
    >
      <!-- Label (shows on hover) -->
      <span
        class="absolute right-6 mr-2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none shadow-lg"
      >
        {{ getSectionLabel(section) }}
      </span>

      <!-- Dot -->
      <span
        :class="[
          'relative h-3 w-3 rounded-full transition-all duration-300',
          activeSection === section
            ? 'scale-100 bg-indigo-600 dark:bg-white'
            : 'scale-75 bg-gray-400/50 dark:bg-white/30 group-hover:scale-100 group-hover:bg-indigo-500 dark:group-hover:bg-white/60',
        ]"
      />
    </button>
  </nav>
</template>
