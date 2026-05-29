<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?:
    | 'gray'
    | 'red'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'indigo'
    | 'purple'
    | 'pink'
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'gray',
  text: 'Badge',
  size: 'md',
})

const baseClasses = 'inline-flex items-center rounded-full border'

const colorClasses = {
  gray: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-400/10 dark:text-gray-400 dark:border-gray-400/30',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/30',
  yellow:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/30',
  green:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/30',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/30',
  indigo:
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-400 dark:border-indigo-400/30',
  purple:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/30',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-400/10 dark:text-pink-400 dark:border-pink-400/30',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

const badgeClasses = computed(() => {
  return `${baseClasses} ${sizeClasses[props.size]} ${colorClasses[props.type]}`
})
</script>

<template>
  <span :class="badgeClasses">
    <slot>{{ props.text }}</slot>
  </span>
</template>

<style scoped></style>
