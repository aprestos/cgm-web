<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { IconMenu2, IconShoppingCart, IconX } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router/routeNames.ts'
import { useCart } from '@/stores/cart.store.ts'
import { formatPrice } from '@/utils/price.ts'

interface Props {
  tenantLogo?: string
  tenantName?: string
  sections?: string[]
  activeSection?: string
}

interface Emits {
  (e: 'cart-click'): void
  (e: 'navigate', section: string): void
}

const props = withDefaults(defineProps<Props>(), {
  tenantLogo: '',
  tenantName: '',
  sections: () => [],
  activeSection: '',
})
const emit = defineEmits<Emits>()
const { t } = useI18n()

const { totalItems, totalPrice } = useCart()
const isMobileMenuOpen = ref<boolean>(false)
const scrollY = ref<number>(0)

const hasItems = computed(() => totalItems.value > 0)
const formattedTotal = computed(() => formatPrice(totalPrice.value))
const desktopSections = computed(() => props.sections.slice(0, 5))
const isHeaderScrolled = computed(() => scrollY.value > 100)

function getSectionLabel(section: string): string {
  switch (section) {
    case 'hero':
      return t('landing.nav.home')
    case 'gallery':
      return t('landing.nav.gallery')
    case 'map':
      return t('landing.nav.location')
    case 'tickets':
      return t('landing.nav.tickets')
    case 'countdown':
      return t('landing.nav.countdown')
    case 'features':
      return t('landing.nav.features')
    case 'games':
      return t('landing.nav.games')
    default:
      return section
  }
}

function handleNavigationClick(section: string): void {
  emit('navigate', section)
  isMobileMenuOpen.value = false

  const element = document.getElementById(section)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

function toggleMobileMenu(): void {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function handleCartClick(): void {
  emit('cart-click')
}

function handleScroll(): void {
  scrollY.value = window.scrollY
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 px-4 sm:px-6 transition-all duration-300"
    :class="
      isHeaderScrolled
        ? 'bg-white/85 py-3 shadow-lg ring-1 ring-gray-200 backdrop-blur-sm dark:bg-gray-950/85 dark:ring-white/10'
        : 'bg-transparent py-4'
    "
  >
    <div
      class="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3"
    >
      <RouterLink
        :to="{ name: RouteNames.public.home }"
        class="group flex min-w-0 items-center gap-3"
      >
        <div
          v-if="tenantLogo"
          class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl p-2 transition-all duration-300 dark:bg-gray-900/90 dark:ring-white/10"
        >
          <img
            :src="tenantLogo"
            :alt="tenantName || 'Logo'"
            class="h-full w-full object-contain"
          />
        </div>
      </RouterLink>

      <nav
        class="hidden items-center justify-center gap-5 lg:flex"
        :aria-label="t('landing.nav.home')"
      >
        <button
          v-for="section in desktopSections"
          :key="section"
          type="button"
          class="text-sm uppercase font-semibold transition-colors duration-200 cursor-pointer text-gray-700 hover:text-indigo-700 dark:text-gray-200 dark:hover:text-white"
          :aria-current="props.activeSection === section ? 'page' : undefined"
          @click="handleNavigationClick(section)"
        >
          {{ getSectionLabel(section) }}
        </button>
      </nav>

      <div class="relative col-start-3 flex items-center justify-end gap-2">
        <Transition
          enter-active-class="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="translate-x-8 scale-50 opacity-0 blur-sm"
          enter-to-class="translate-x-0 scale-100 opacity-100 blur-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="translate-x-0 scale-100 opacity-100"
          leave-to-class="translate-x-8 scale-50 opacity-0"
        >
          <button
            v-if="hasItems"
            type="button"
            class="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
            @click="handleCartClick"
          >
            <span class="relative flex items-center">
              <IconShoppingCart
                class="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110"
                :stroke-width="2"
              />
              <span
                class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
              >
                {{ totalItems }}
              </span>
            </span>
            <span
              class="hidden text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-primary sm:inline dark:text-gray-100 dark:group-hover:text-primary-300"
            >
              {{ formattedTotal }}
            </span>
          </button>
        </Transition>

        <button
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-xl text-gray-800 transition-colors hover:text-primary lg:hidden dark:text-white"
          :aria-expanded="isMobileMenuOpen"
          :aria-label="
            isMobileMenuOpen ? t('landing.nav.home') : t('landing.nav.home')
          "
          aria-controls="landing-mobile-menu"
          @click="toggleMobileMenu"
        >
          <IconX v-if="isMobileMenuOpen" class="h-5 w-5" />
          <IconMenu2 v-else class="h-5 w-5" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div
            v-if="isMobileMenuOpen"
            id="landing-mobile-menu"
            class="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-gray-200 backdrop-blur-sm lg:hidden dark:bg-gray-900/95 dark:ring-white/10"
          >
            <nav
              class="flex flex-col gap-1"
              :aria-label="t('landing.nav.home')"
            >
              <button
                v-for="section in props.sections"
                :key="section"
                type="button"
                class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
                :class="
                  props.activeSection === section
                    ? 'bg-primary text-white'
                    : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10'
                "
                :aria-current="
                  props.activeSection === section ? 'page' : undefined
                "
                @click="handleNavigationClick(section)"
              >
                {{ getSectionLabel(section) }}
              </button>
            </nav>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
