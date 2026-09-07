<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSettingsStore } from '@/features/settings/useSettings.store'
// Components
import HeaderComponent from './HeaderComponent.vue'
import CartDrawer from '@/views/landing/CartDrawer.vue'
import { useEditionStore } from '@/features/events/edition.store'

const editionStore = useEditionStore()
const settingsStore = useSettingsStore()

// Stores
const settings = computed(() => settingsStore.settings)

// Data
const SECTION_ACTIVE_OFFSET = 200
const scrollY = ref<number>(0)
const activeSection = ref<string>('hero')

// Computed
const isTicketsEnabled = computed(
  () => settings.value?.tickets?.enabled ?? false,
)
const hasScheduleImages = computed(
  () => (editionStore.edition?.schedule_images?.length ?? 0) > 0,
)

// Navigation sections (dynamic based on enabled features)
const navigationSections = computed(() => {
  const sections = []

  if (hasScheduleImages.value) {
    sections.push('schedule')
  }

  if (isTicketsEnabled.value) {
    sections.push('tickets')
  }

  if (editionStore.edition?.location?.url) {
    sections.push('location')
  }

  return sections
})

// Handle scroll
function handleScroll(): void {
  scrollY.value = window.scrollY

  activeSection.value = getVisibleSection() ?? 'hero'
}

function getVisibleSection(): string | null {
  for (const section of navigationSections.value) {
    const element = document.getElementById(section)
    if (!element) {
      continue
    }

    const rect = element.getBoundingClientRect()
    if (
      rect.top <= SECTION_ACTIVE_OFFSET &&
      rect.bottom >= SECTION_ACTIVE_OFFSET
    ) {
      return section
    }
  }

  return null
}

function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const isCartDrawerOpen = ref<boolean>(false)

function openCartDrawer(): void {
  isCartDrawerOpen.value = true
}
</script>

<template>
  <div
    class="relative bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden"
  >
    <!-- Fixed Header with Logo -->
    <HeaderComponent
      :sections="navigationSections"
      :active-section="activeSection"
      @navigate="scrollToSection"
      @cart-click="openCartDrawer"
    />
    <router-view />

    <CartDrawer v-model:open="isCartDrawerOpen" />
  </div>
</template>
