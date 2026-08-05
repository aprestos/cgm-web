<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="flex items-center" :class="contentClasses">
      <svg
        class="animate-spin"
        :class="spinnerClasses"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <template v-if="loadingText">{{ loadingText }}</template>
    </span>
    <span v-else class="flex items-center" :class="contentClasses">
      <slot name="icon-left" />
      <slot />
      <slot name="icon-right" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?:
    'primary' | 'secondary' | 'tertiary' | 'yellow' | 'danger' | 'transparent'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  // No default: callers pass a translated string, an English fallback would leak.
  loadingText: undefined,
  fullWidth: false,
  rounded: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-colors',
    'duration-150',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'cursor-pointer',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  // Dashboard-scale sizing: ~28/32/36/40px tall. Gaps live on the content
  // span (the actual flex container), not here.
  const sizeClasses = {
    sm: ['px-2.5', 'py-1.5', 'text-xs'],
    md: ['px-3', 'py-1.5', 'text-sm'],
    lg: ['px-4', 'py-2', 'text-sm'],
    xl: ['px-5', 'py-2.5', 'text-sm'],
  }

  // Variant classes — flat surfaces, colour-only hover. No coloured glows and
  // no shadow growth on hover: those read as marketing CTAs, not app controls.
  const variantClasses = {
    primary: [
      'bg-indigo-600',
      'text-white',
      'shadow-xs',
      'hover:bg-indigo-500',
      'focus-visible:outline-indigo-600',
      'dark:bg-indigo-500',
      'dark:shadow-none',
      'dark:hover:bg-indigo-400',
      'dark:focus-visible:outline-indigo-500',
    ],
    secondary: [
      'bg-white',
      'text-gray-900',
      'shadow-xs',
      'ring-1',
      'ring-inset',
      'ring-gray-300',
      'hover:bg-gray-50',
      'focus-visible:outline-indigo-600',
      'dark:bg-white/10',
      'dark:text-white',
      'dark:shadow-none',
      'dark:ring-white/10',
      'dark:hover:bg-white/20',
      'dark:focus-visible:outline-indigo-500',
    ],
    tertiary: [
      'bg-gray-100',
      'text-gray-900',
      'shadow-xs',
      'hover:bg-gray-200',
      'focus-visible:outline-gray-500',
      'dark:bg-gray-700',
      'dark:text-white',
      'dark:shadow-none',
      'dark:hover:bg-gray-600',
      'dark:focus-visible:outline-gray-400',
    ],
    yellow: [
      'bg-amber-500',
      'text-white',
      'shadow-xs',
      'hover:bg-amber-400',
      'focus-visible:outline-amber-500',
      'dark:shadow-none',
      'dark:hover:bg-amber-400',
      'dark:focus-visible:outline-amber-500',
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'shadow-xs',
      'hover:bg-red-500',
      'focus-visible:outline-red-600',
      'dark:bg-red-500',
      'dark:shadow-none',
      'dark:hover:bg-red-400',
      'dark:focus-visible:outline-red-500',
    ],
    transparent: [
      'bg-transparent',
      'text-gray-700',
      'hover:bg-gray-100',
      'active:bg-gray-200',
      'focus-visible:outline-gray-500',
      'dark:text-gray-300',
      'dark:hover:bg-gray-800',
      'dark:active:bg-gray-700',
      'dark:focus-visible:outline-gray-400',
    ],
  }

  // Border radius classes
  const roundedClasses = props.rounded ? ['rounded-full'] : ['rounded-lg']

  // Full width classes
  const widthClasses = props.fullWidth ? ['w-full'] : []

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...variantClasses[props.variant],
    ...roundedClasses,
    ...widthClasses,
  ].join(' ')
})

const CONTENT_GAP: Record<NonNullable<Props['size']>, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
  xl: 'gap-2.5',
}

const contentClasses = computed(() => CONTENT_GAP[props.size])

// Matched to the label so the button keeps its height while loading.
const spinnerClasses = computed(() =>
  props.size === 'sm' ? 'size-3.5' : 'size-4',
)
</script>
