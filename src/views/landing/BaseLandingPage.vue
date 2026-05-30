<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { settingsStore } from '@/features/settings/useSettings.store'
// Components
import HeaderComponent from './HeaderComponent.vue'
import CartDrawer from '@/views/landing/CartDrawer.vue'
import { editionStore } from '@/stores/edition.ts'

// Stores
const settings = computed(() => settingsStore.value)

// Data
const scrollY = ref<number>(0)
const activeSection = ref<string>('hero')

// Computed
const isTicketsEnabled = computed(
  () => settings.value?.tickets?.enabled ?? false,
)

// Navigation sections (dynamic based on enabled features)
const navigationSections = computed(() => {
  const sections = []

  if (isTicketsEnabled.value) {
    sections.push('tickets')
  }

  if (editionStore.value?.location?.url) {
    sections.push('location')
  }

  return sections
})

// Handle scroll
function handleScroll(): void {
  scrollY.value = window.scrollY

  for (const section of navigationSections.value) {
    const element = document.getElementById(section)
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top <= 200 && rect.bottom >= 200) {
        activeSection.value = section
        break
      }
    }
  }
}

function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
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
