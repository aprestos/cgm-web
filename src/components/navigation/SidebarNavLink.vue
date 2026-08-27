<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { NavigationItem } from '@/navigation/navigation.model.ts'

const { t } = useI18n()

const props = defineProps<{
  item: NavigationItem
}>()

const route = useRoute()

const isActive = computed(() =>
  route.matched.some((r) => r.name === props.item.routeName),
)
</script>

<template>
  <RouterLink
    :to="{ name: item.routeName }"
    :class="[
      isActive
        ? 'bg-gray-100 text-primary-600 dark:bg-white/5 dark:text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
    ]"
  >
    <component
      :is="item.icon"
      stroke="1.5"
      :class="[
        isActive
          ? 'text-primary-600 dark:text-white'
          : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-white',
        'size-6 shrink-0',
      ]"
      aria-hidden="true"
    />
    <span>{{ t(`admin.navigation.${item.id}`) }}</span>
  </RouterLink>
</template>
