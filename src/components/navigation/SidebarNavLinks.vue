<script setup lang="ts">
import { computed } from 'vue'
import SidebarNavLink from '@/components/navigation/SidebarNavLink.vue'
import type { NavigationItem } from '@/navigation/navigation.model.ts'

const props = defineProps<{
  topNavigation: NavigationItem[]
  bottomNavigation: NavigationItem[]
}>()

const topItems = computed(() => props.topNavigation.filter((i) => i.enabled))
const bottomItems = computed(() =>
  props.bottomNavigation.filter((i) => i.enabled),
)
</script>

<template>
  <nav class="flex flex-1 flex-col">
    <ul role="list" class="flex flex-1 flex-col gap-y-7">
      <li>
        <ul role="list" class="-mx-2 space-y-1">
          <li v-for="item in topItems" :key="item.routeName">
            <SidebarNavLink :item="item" />
          </li>
        </ul>
      </li>
    </ul>

    <!-- Settings Section -->
    <div v-for="item in bottomItems" :key="item.routeName" class="mb-3">
      <SidebarNavLink :item="item" class="-mx-2" />
    </div>

    <slot />
  </nav>
</template>
