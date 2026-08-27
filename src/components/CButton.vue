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
    | 'primary'
    | 'soft'
    | 'secondary'
    | 'tertiary'
    | 'yellow'
    | 'danger'
    | 'transparent'
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
  // Press feedback lives here rather than in the variants because it has to
  // behave the same everywhere. Touch devices never get :hover, and the one
  // they do get sticks after the finger lifts, so :active is what actually
  // tells someone the tap landed. `transition` (not transition-colors) so the
  // scale animates; :active cannot match a disabled button, so the press
  // states need no disabled guard.
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition',
    'duration-150',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'cursor-pointer',
    'active:scale-[0.97]',
    'motion-reduce:active:scale-100',
    // Removes the ~300ms double-tap-zoom wait, and the grey flash Android and
    // iOS paint over the top of our own press state.
    'touch-manipulation',
    '[-webkit-tap-highlight-color:transparent]',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  // Dashboard-scale sizing: ~28/32/36/40px tall. Gaps live on the content
  // span (the actual flex container), not here.
  const sizeClasses = {
    sm: ['md:px-2.5', 'md:py-1.5', 'text-xs'],
    md: ['md:px-3 px-4', 'md:py-1.5 py-2', 'text-sm'],
    lg: ['md:px-4 px-6', 'md:py-2 py-3', 'text-sm'],
    xl: ['md:px-5 px-8', 'md:py-2.5 py-4', 'text-sm'],
  }

  // Variant classes — flat surfaces, colour-only hover. No coloured glows and
  // no shadow growth on hover: those read as marketing CTAs, not app controls.
  // Hover lightens a filled button; pressing pushes it past its resting colour
  // in the other direction, so a press never looks like a lingering hover.
  const variantClasses = {
    primary: [
      'bg-primary-600',
      'text-white',
      'shadow-xs',
      'hover:bg-primary-500',
      'active:bg-primary-700',
      'focus-visible:outline-primary-600',
      'dark:bg-primary-500',
      'dark:shadow-none',
      'dark:hover:bg-primary-400',
      'dark:active:bg-primary-600',
      'dark:focus-visible:outline-primary-500',
    ],
    // Brand hue, unfilled. For actions that are clearly interactive but are
    // not the one thing the screen is asking for — an "add another" inside a
    // form whose real submit sits in the footer. Deliberately shares primary's
    // hue rather than introducing a neutral: a per-tenant theme repaints one
    // hue and both variants follow, which a black/white variant could not do.
    soft: [
      'bg-primary-50',
      'text-primary-700',
      'ring-1',
      'ring-inset',
      'ring-primary-200',
      'hover:bg-primary-100',
      'active:bg-primary-200',
      'focus-visible:outline-primary-600',
      'dark:bg-primary-500/10',
      'dark:text-primary-300',
      'dark:ring-primary-400/20',
      'dark:hover:bg-primary-500/20',
      'dark:active:bg-primary-500/25',
      'dark:focus-visible:outline-primary-500',
    ],
    secondary: [
      'bg-white',
      'text-gray-900',
      'shadow-xs',
      'ring-1',
      'ring-inset',
      'ring-gray-300',
      'hover:bg-gray-50',
      'active:bg-gray-100',
      'focus-visible:outline-primary-600',
      'dark:bg-white/10',
      'dark:text-white',
      'dark:shadow-none',
      'dark:ring-white/10',
      'dark:hover:bg-white/20',
      'dark:active:bg-white/25',
      'dark:focus-visible:outline-primary-500',
    ],
    tertiary: [
      'bg-gray-100',
      'text-gray-900',
      'shadow-xs',
      'hover:bg-gray-200',
      'active:bg-gray-300',
      'focus-visible:outline-gray-500',
      'dark:bg-gray-700',
      'dark:text-white',
      'dark:shadow-none',
      'dark:hover:bg-gray-600',
      'dark:active:bg-gray-500',
      'dark:focus-visible:outline-gray-400',
    ],
    yellow: [
      'bg-amber-500',
      'text-white',
      'shadow-xs',
      'hover:bg-amber-400',
      'active:bg-amber-600',
      'focus-visible:outline-amber-500',
      'dark:shadow-none',
      'dark:hover:bg-amber-400',
      'dark:active:bg-amber-600',
      'dark:focus-visible:outline-amber-500',
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'shadow-xs',
      'hover:bg-red-500',
      'active:bg-red-700',
      'focus-visible:outline-red-600',
      'dark:bg-red-500',
      'dark:shadow-none',
      'dark:hover:bg-red-400',
      'dark:active:bg-red-600',
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
