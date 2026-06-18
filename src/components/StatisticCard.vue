<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import BaseCard from '@/components/BaseCard.vue'

type Color =
  | 'slate'
  | 'gray'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

interface Props {
  label: string
  value: string | number
  icon: Component
  color?: Color
  subtitle?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'amber',
  subtitle: '',
  loading: false,
})

const COLOR_ICON_CLASSES: Partial<Record<Color, { text: string; bg: string }>> = {
  amber: { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  fuchsia: {
    text: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
  },
  green: { text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  sky: { text: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
}

const iconClasses = computed(() =>
  COLOR_ICON_CLASSES[props.color] ?? (COLOR_ICON_CLASSES.amber as { text: string; bg: string }),
)
</script>

<template>
  <BaseCard>
    <div v-if="loading" class="flex flex-col justify-between animate-pulse">
      <div class="flex flex-row items-center">
        <div class="rounded-md w-8 h-8 bg-gray-200 dark:bg-gray-700" />
        <div class="ml-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div class="flex justify-end mt-2">
        <div class="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <div v-else class="flex flex-col justify-between">
      <div class="flex flex-row items-center">
        <div
          class="flex items-center justify-center rounded-md w-8 h-8"
          :class="iconClasses.bg"
        >
          <component :is="icon" class="size-4" :class="iconClasses.text" />
        </div>
        <span
          class="font-display text-sm font-medium text-slate-500 ml-2 dark:text-slate-400"
        >
          {{ label }}
        </span>
      </div>
      <p
        class="flex mt-2 text-2xl font-bold dark:text-white text-black font-display"
      >
        {{ value }}
      </p>
      <p
        v-if="subtitle"
        class="hidden mt-2 text-xs text-gray-600 dark:text-gray-400"
      >
        {{ subtitle }}
      </p>
    </div>
  </BaseCard>
</template>
