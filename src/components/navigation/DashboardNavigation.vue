<script setup lang="ts">
import { ref } from 'vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useRoute } from 'vue-router'
import type { User } from '@/features/auth/user.model.ts'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { IconMenu2 } from '@tabler/icons-vue'
import SidebarUserProfile from '@/components/navigation/SidebarUserProfile.vue'
import SidebarNavLinks from '@/components/navigation/SidebarNavLinks.vue'
import EditionBadge from '@/components/navigation/EditionBadge.vue'
import type { NavigationItem } from '@/navigation/navigation.model.ts'
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { RouteNames } from '@/router/routeNames.ts'
import { useHideOnScroll } from '@/composables/useHideOnScroll'

const tenantStore = useTenantStore()

defineProps<{
  topNavigation: NavigationItem[]
  bottomNavigation: NavigationItem[]
  user: User | null
}>()

defineEmits<{
  close: []
}>()

const route = useRoute()

const homeRouteName = RouteNames.landing.home

const sidebarOpen = ref<boolean>(false)

// Slide the mobile header out of the way on the way down, bring it back on the
// way up — same behaviour as the public TopNavigation.
const isHidden = useHideOnScroll()
</script>

<template>
  <!-- Generates no box of its own, so the sticky header below is constrained by
       the page rather than by this wrapper, which is only as tall as the header -->
  <div class="contents">
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to=""
          leave="transition-opacity ease-linear duration-300"
          leave-from=""
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80"></div>
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to=""
                leave="ease-in-out duration-300"
                leave-from=""
                leave-to="opacity-0"
              >
                <div
                  class="absolute top-0 left-full flex w-16 justify-center pt-5"
                >
                  <button
                    type="button"
                    class="-m-2.5 p-2.5"
                    @click="sidebarOpen = false"
                  >
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="size-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div
                class="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10"
              >
                <div class="relative flex h-16 shrink-0 items-center">
                  <img
                    class="h-8 w-auto dark:hidden"
                    :src="tenantStore.getLogo(LogoType.long)"
                    :alt="tenantStore.tenant?.name"
                  />
                  <img
                    class="h-8 w-auto not-dark:hidden"
                    :src="tenantStore.getLogo(LogoType.long)"
                    alt="tenantStore.tenant?.name"
                  />
                </div>
                <SidebarNavLinks
                  class="relative"
                  :top-navigation="topNavigation"
                  :bottom-navigation="bottomNavigation"
                  @click="sidebarOpen = false"
                />
                <SidebarUserProfile class="-mx-6 mt-auto" :user="user" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    >
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div
        class="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-50 px-6 ring-1 ring-slate-200 dark:bg-gray-950 dark:ring-white/10"
      >
        <!-- Full-bleed band so the edition reads as the sidebar's header
             rather than as the first item of the nav below it -->
        <div
          class="-mx-6 shrink-0 border-b border-gray-200 px-4 py-3 dark:border-white/10"
        >
          <router-link
            :to="{ name: homeRouteName }"
            class="flex rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <EditionBadge />
          </router-link>
        </div>
        <SidebarNavLinks
          :top-navigation="topNavigation"
          :bottom-navigation="bottomNavigation"
        >
          <!-- Separator -->
          <div class="-mx-6 mt-auto">
            <div class="border-t border-gray-200 dark:border-white/10"></div>
          </div>

          <!-- User Profile -->
          <SidebarUserProfile class="-mx-6 mt-auto" :user="user" />
        </SidebarNavLinks>
      </div>
    </div>

    <header
      class="sticky top-0 z-40 flex flex-col border-b border-gray-200 bg-white transition-transform duration-300 motion-reduce:transition-none lg:hidden dark:border-white/10 dark:bg-gray-950"
      :class="isHidden ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="flex items-center gap-x-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          class="-m-2.5 shrink-0 p-2.5 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          @click="sidebarOpen = true"
        >
          <span class="sr-only">Open sidebar</span>
          <IconMenu2 class="size-6" aria-hidden="true" />
        </button>
        <div
          class="min-w-0 flex-1 truncate font-display text-lg font-semibold text-gray-900 dark:text-white"
        >
          {{ route.meta.title }}
        </div>
        <!-- Capped rather than shrink-0: on a narrow screen the page title and
             the edition each give up room instead of one pushing the other out -->
        <router-link
          :to="{ name: homeRouteName }"
          class="-mr-2 max-w-[50%] rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <EditionBadge size="sm" />
        </router-link>
      </div>

      <!-- Teleport target. Below lg a section's SecondaryNavigation moves itself
           in here, so its tabs read as the bottom row of this header instead of
           stacking a second bordered bar directly underneath it. Stays empty,
           and therefore zero-height, on sections that have no tabs. -->
      <div id="secondary-navigation"></div>
    </header>
  </div>
</template>

<style scoped></style>
