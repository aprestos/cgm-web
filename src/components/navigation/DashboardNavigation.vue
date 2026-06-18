<script setup lang="ts">
import { ref } from 'vue'
import { getTenantLogo, tenantStore } from '@/stores/tenant.ts'
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
import { useI18n } from 'vue-i18n'
import type { NavigationItem } from '@/navigation/navigation.model.ts'
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { editionStore } from '@/stores/edition.ts'
import { formatDateRange } from '@/utils/date.ts'

const { t, locale } = useI18n()

interface PublicPage {
  id: string
  routeName: string
  initial: string
  enabled: boolean
}

defineProps<{
  topNavigation: NavigationItem[]
  bottomNavigation: NavigationItem[]
  publicPages: PublicPage[]
  user: User | null
}>()

defineEmits<{
  close: []
}>()

const route = useRoute()

const sidebarOpen = ref<boolean>(false)
</script>

<template>
  <div>
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
                    :src="getTenantLogo(LogoType.long)"
                    :alt="tenantStore?.name"
                  />
                  <img
                    class="h-8 w-auto not-dark:hidden"
                    :src="getTenantLogo(LogoType.long)"
                    alt="tenantStore?.name"
                  />
                </div>
                <nav class="relative flex flex-1 flex-col">
                  <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" class="-mx-2 space-y-1">
                        <li v-for="item in topNavigation" :key="item.routeName">
                          <RouterLink
                            v-if="item.enabled"
                            :to="{ name: item.routeName }"
                            :class="[
                              route.matched.some(
                                (r) => r.name === item.routeName,
                              )
                                ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            ]"
                          >
                            <component
                              :is="item.icon"
                              stroke="1.5"
                              :class="[
                                route.matched.some(
                                  (r) => r.name === item.routeName,
                                )
                                  ? 'text-indigo-600 dark:text-white'
                                  : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                'size-6 shrink-0',
                              ]"
                              aria-hidden="true"
                            />
                            {{ t(`admin.navigation.${item.id}`) }}
                          </RouterLink>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <div class="text-xs/6 font-semibold text-gray-400">
                        Public pages
                      </div>
                      <ul role="list" class="-mx-2 mt-2 space-y-1">
                        <li v-for="item in publicPages" :key="item.id">
                          <RouterLink
                            v-if="item.enabled"
                            :to="{ name: item.routeName }"
                            class="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                          >
                            <span
                              class="border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5"
                              >{{ item.initial }}</span
                            >
                            <span class="truncate">{{
                              t(`admin.navigation.${item.id}`)
                            }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
                <SidebarUserProfile :user="user" />
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
        class="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-50 px-6 ring-1 ring-slate-200 dark:bg-black/20 dark:ring-white/5"
      >
        <router-link :to="{ name: RouteNames.landing.home }">
          <div class="flex flex-row h-16 shrink-0 items-center">
            <!-- Logo SkeletonLoader -->
            <!--        <SkeletonLoader v-if="!tenantStore?.logo" width="128px" height="32px" />-->
            <!-- Actual Logo -->
            <img
              class="h-10 w-auto"
              :src="
                getTenantLogo(LogoType.square) || '@/assets/logoipsum-381.svg'
              "
              :alt="tenantStore?.name + ' logo'"
            />
            <div class="flex flex-col">
              <span
                class="font-display font-bold dark:text-gray-300 text-gray-800"
                >{{ editionStore?.name }}</span
              >
              <span class="text-sm dark:text-gray-500 text-gray-800"
                >{{
                  formatDateRange(
                    editionStore?.start_date,
                    editionStore?.end_date,
                    locale,
                  )
                }}
              </span>
            </div>
          </div>
        </router-link>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in topNavigation" :key="item.routeName">
                  <RouterLink
                    v-if="item.enabled"
                    :to="{ name: item.routeName }"
                    :class="[
                      route.matched.some((r) => r.name === item.routeName)
                        ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    ]"
                  >
                    <component
                      :is="item.icon"
                      stroke="1.5"
                      :class="[
                        route.matched.some((r) => r.name === item.routeName)
                          ? 'text-indigo-600 dark:text-white'
                          : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                        'size-6 shrink-0',
                      ]"
                      aria-hidden="true"
                    />
                    <span>{{ t(`admin.navigation.${item.id}`) }}</span>
                  </RouterLink>
                </li>
              </ul>
            </li>
            <li>
              <div
                class="text-xs/6 font-semibold text-gray-500 dark:text-gray-400"
              >
                Public pages
              </div>
              <ul role="list" class="-mx-2 mt-2 space-y-1">
                <li v-for="item in publicPages" :key="item.id">
                  <RouterLink
                    v-if="item.enabled"
                    :to="{ name: item.routeName }"
                    class="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                  >
                    <span
                      class="border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5"
                      >{{ item.initial }}</span
                    >
                    <span class="truncate">{{
                      t(`admin.navigation.${item.id}`)
                    }}</span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </ul>

          <!-- Settings Section -->
          <div
            v-for="item in bottomNavigation"
            :key="item.routeName"
            class="mb-3"
          >
            <RouterLink
              :to="{ name: item.routeName }"
              :class="[
                route.matched.some((r) => r.name === item.routeName)
                  ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold -mx-2',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  route.matched.some((r) => r.name === item.routeName)
                    ? 'text-indigo-600 dark:text-white'
                    : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                  'size-6 shrink-0',
                ]"
                aria-hidden="true"
              />
              {{ t(`admin.navigation.${item.id}`) }}
            </RouterLink>
          </div>

          <!-- Separator -->
          <div class="-mx-6 mt-auto">
            <div class="border-t border-gray-200 dark:border-white/10"></div>
          </div>

          <!-- User Profile -->
          <SidebarUserProfile class="-mx-6 mt-auto" :user="user" />
        </nav>
      </div>
    </div>

    <div
      class="flex items-center gap-x-6 px-4 py-4 sm:px-6 lg:hidden dark:after:pointer-events-none dark:after:absolute"
    >
      <button
        type="button"
        class="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
        @click="sidebarOpen = true"
      >
        <span class="sr-only">Open sidebar</span>
        <IconMenu2 class="size-6" aria-hidden="true" />
      </button>
      <div
        class="flex-1 text-lg font-semibold font-display text-gray-900 dark:text-white"
      >
        {{ route.meta.title }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
