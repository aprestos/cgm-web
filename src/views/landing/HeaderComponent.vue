<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  IconMenu2,
  IconShoppingCart,
  IconUserCircle,
  IconX,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { RouteNames } from '@/router/routeNames'
import { useCart } from '@/stores/cart.store'
import { formatPrice } from '@/utils/price'
import { getTenantLogo, tenantStore } from '@/stores/tenant'
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { authService } from '@/features/auth/service'
import type { User } from '@/features/auth/user.model'

interface Props {
  sections?: string[]
  activeSection?: string
}

interface Emits {
  (e: 'cart-click'): void
  (e: 'navigate', section: string): void
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  activeSection: '',
})
const emit = defineEmits<Emits>()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { totalItems, totalPrice } = useCart()
const isMobileMenuOpen = ref<boolean>(false)
const isAccountMenuOpen = ref<boolean>(false)
const scrollY = ref<number>(0)
const user = ref<User | null>(null)
const DEFAULT_HERO_FADE_DISTANCE = 420
const MIN_HERO_FADE_DISTANCE = 240
const MAX_HEADER_OPACITY = 0.85
const HERO_FADE_RATIO = 0.8
const heroFadeDistance = ref<number>(DEFAULT_HERO_FADE_DISTANCE)
const heroResizeObserver = ref<ResizeObserver | null>(null)

const hasItems = computed(() => totalItems.value > 0)
const isAuthenticated = computed<boolean>(() => user.value !== null)
const displayName = computed<string>(
  () => user.value?.name || t('landing.header.accountFallbackName'),
)
const formattedTotal = computed(() => formatPrice(totalPrice.value))
const desktopSections = computed(() => props.sections.slice(0, 5))
const headerProgress = computed<number>(() => {
  const progress = scrollY.value / heroFadeDistance.value
  return Math.min(Math.max(progress, 0), 1)
})
const headerBackgroundOpacity = computed<number>(
  () => headerProgress.value * MAX_HEADER_OPACITY,
)
const headerBlurStyle = computed<CSSProperties>(() => {
  const blur = (headerProgress.value * 6).toFixed(2)
  return {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  }
})
const mobileMenuAriaLabel = computed<string>(() =>
  isMobileMenuOpen.value
    ? t('landing.header.closeMenu')
    : t('landing.header.openMenu'),
)
const accountButtonAriaLabel = computed<string>(() =>
  isAuthenticated.value
    ? t('landing.header.accountMenu')
    : t('landing.header.signInToViewAccount'),
)

function getSectionLabel(section: string): string {
  return t(`landing.nav.${section}`)
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
  isAccountMenuOpen.value = false
}

function handleCartClick(): void {
  emit('cart-click')
  isAccountMenuOpen.value = false
}

async function handleAccountClick(): Promise<void> {
  if (!isAuthenticated.value) {
    await router.push({
      name: RouteNames.auth.signIn,
      query: { redirect: route.fullPath },
    })
    return
  }

  isAccountMenuOpen.value = !isAccountMenuOpen.value
  isMobileMenuOpen.value = false
}

function handleScroll(): void {
  scrollY.value = window.scrollY
}

async function loadUser(): Promise<void> {
  user.value = await authService.getUser()
}

function getHeroFadeDistance(): number {
  const heroElement = document.getElementById('hero')

  if (!heroElement) {
    return DEFAULT_HERO_FADE_DISTANCE
  }

  const heroHeight = heroElement.getBoundingClientRect().height
  return Math.max(heroHeight * HERO_FADE_RATIO, MIN_HERO_FADE_DISTANCE)
}

function updateHeroFadeDistance(): void {
  heroFadeDistance.value = getHeroFadeDistance()
}

function observeHeroSection(): void {
  const heroElement = document.getElementById('hero')

  if (!heroElement || typeof ResizeObserver === 'undefined') {
    return
  }

  heroResizeObserver.value = new ResizeObserver(() => {
    updateHeroFadeDistance()
  })

  heroResizeObserver.value.observe(heroElement)
}

onMounted(() => {
  void loadUser()
  updateHeroFadeDistance()
  observeHeroSection()
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateHeroFadeDistance)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateHeroFadeDistance)
  heroResizeObserver.value?.disconnect()
  heroResizeObserver.value = null
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] sm:px-6 sm:pt-4 transition-[padding] duration-300"
    :class="headerProgress > 0 ? 'py-3' : 'py-4'"
    :style="headerBlurStyle"
  >
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-gray-50 transition-opacity duration-150 dark:bg-gray-950"
      :style="{ opacity: headerBackgroundOpacity }"
    />
    <div
      class="pointer-events-none absolute inset-0 -z-10 shadow-lg ring-1 ring-gray-200/70 transition-opacity duration-150 dark:ring-white/10"
      :style="{ opacity: headerProgress }"
    />

    <div
      class="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3"
    >
      <RouterLink
        :to="{ name: RouteNames.landing.home }"
        class="group flex min-w-0 items-center gap-3"
      >
        <div class="flex shrink-0 items-center overflow-hidden">
          <img
            :src="getTenantLogo(LogoType.long)"
            :alt="tenantStore?.name || t('landing.header.logoAltFallback')"
            class="h-10 w-auto max-w-40 object-contain"
          />
        </div>
      </RouterLink>

      <nav
        class="hidden items-center justify-center gap-5 lg:flex"
        :aria-label="t('landing.header.primaryNavAriaLabel')"
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

        <div class="relative">
          <button
            type="button"
            class="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
            :aria-label="accountButtonAriaLabel"
            :aria-expanded="isAuthenticated ? isAccountMenuOpen : undefined"
            aria-controls="landing-account-menu"
            @click="handleAccountClick"
          >
            <IconUserCircle
              class="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110"
              :stroke-width="2"
              aria-hidden="true"
            />
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
              v-if="isAuthenticated && isAccountMenuOpen"
              id="landing-account-menu"
              class="absolute right-0 top-full mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-gray-50/95 p-4 text-left shadow-2xl ring-1 ring-gray-200/70 backdrop-blur-sm dark:bg-gray-900/95 dark:ring-white/10"
            >
              <p
                class="truncate text-sm font-semibold text-gray-900 dark:text-white"
              >
                {{ displayName }}
              </p>
              <p class="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                {{ user?.email }}
              </p>
            </div>
          </Transition>
        </div>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100/90 text-gray-800 transition-colors hover:text-primary lg:hidden dark:bg-gray-900/80 dark:text-white"
          :aria-expanded="isMobileMenuOpen"
          :aria-label="mobileMenuAriaLabel"
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
            class="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-gray-50/95 p-3 shadow-2xl ring-1 ring-gray-200/70 backdrop-blur-sm lg:hidden dark:bg-gray-900/95 dark:ring-white/10"
          >
            <nav
              class="flex flex-col gap-1"
              :aria-label="t('landing.header.mobileNavAriaLabel')"
            >
              <button
                v-for="section in props.sections"
                :key="section"
                type="button"
                class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10"
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
