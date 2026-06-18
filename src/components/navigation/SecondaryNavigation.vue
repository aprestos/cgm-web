<script setup lang="ts">
import { useRoute } from 'vue-router'

export interface SecondaryNavigationItem {
  name: string
  routeName: string
  icon?: unknown
}

defineProps<{
  items: SecondaryNavigationItem[]
}>()

const route = useRoute()

const isActive = (routeName: string): boolean => route.name === routeName
</script>

<template>
  <header class="border-b border-gray-200 dark:border-white/5">
    <nav class="flex overflow-x-auto pt-1 lg:pt-2">
      <ul
        role="list"
        class="flex min-w-full flex-none text-sm px-4 gap-4 sm:px-6 sm:gap-6 font-sans"
      >
        <li v-for="item in items" :key="item.routeName">
          <RouterLink
            :to="{ name: item.routeName }"
            :class="[
              isActive(item.routeName)
                ? 'font-semibold text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'font-medium text-slate-400 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-gray-200',
              'flex items-center gap-x-2 border-b pb-2 lg:pb-3 pt-0 lg:pt-2',
            ]"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="hidden h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <span class="font-sans">{{ item.name }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
