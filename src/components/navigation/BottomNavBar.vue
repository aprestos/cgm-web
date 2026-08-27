<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { NavigationItem } from '@/navigation/navigation.model.ts'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps<{
  navigation: NavigationItem[]
}>()

const route = useRoute()
</script>

<template>
  <!-- Bottom Navigation Bar - Mobile Only (Floating & Rounded) -->
  <div
    class="fixed bottom-0 z-50 lg:hidden px-2 pb-2 pointer-events-none safe-area-inset-bottom"
  >
    <div
      class="bg-black/10 dark:bg-white/10 rounded-full shadow-lg border border-gray-300/70 dark:border-white/5 pointer-events-auto backdrop-blur-lg bg-opacity-50 dark:bg-opacity-50"
    >
      <div class="flex items-center py-1 px-1">
        <RouterLink
          v-for="item in navigation"
          :key="item.id"
          :to="{ name: item.routeName }"
          :class="[
            item.routeName === route.name
              ? 'text-primary-600 dark:text-primary-400 bg-white/60 dark:bg-primary-950/50'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
            'flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-full transition-all min-w-0',
          ]"
        >
          <component
            :is="item.icon"
            class="size-6 shrink-0"
            aria-hidden="true"
          />
          <span class="hidden text-xs font-medium truncate max-w-full">{{
            t(`admin.navigation.${item.id}`)
          }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add safe area padding for devices with notches */
.safe-area-inset-bottom {
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}
</style>
