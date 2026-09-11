<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :aria-pressed="pressed"
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
import {
  BUTTON_BASE,
  BUTTON_CONTENT_GAP,
  BUTTON_SIZE,
  BUTTON_SPINNER_SIZE,
  BUTTON_VARIANT,
  BUTTON_VARIANT_PRESSED,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/button.styles'
import { FIELD_RADIUS, FIELD_RADIUS_PILL } from '@/components/field.styles'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  rounded?: boolean
  /**
   * Makes this a toggle button: it renders `aria-pressed` and holds a visible
   * on-state until it is pressed again. `:active` cannot do this — it only
   * lasts as long as the finger is down.
   *
   * Leave it undefined on a button that just fires an action. A blanket
   * `aria-pressed="false"` would have screen readers announce "not pressed"
   * on every Save and Cancel in the app.
   */
  pressed?: boolean
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
  // Explicitly undefined, not absent: Vue casts an absent boolean prop to
  // `false`, which is the one value that must not reach the template here.
  pressed: undefined,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

// Every class list lives in button.styles.ts; all this does is pick between
// them. Radius comes from the fields instead: a button and the input above it
// are the same control shape, and an 8px button under a 12px field reads as
// two different systems.
const buttonClasses = computed(() =>
  [
    ...BUTTON_BASE,
    ...BUTTON_SIZE[props.size],
    ...(props.pressed
      ? BUTTON_VARIANT_PRESSED[props.variant]
      : BUTTON_VARIANT[props.variant]),
    props.rounded ? FIELD_RADIUS_PILL : FIELD_RADIUS,
    ...(props.fullWidth ? ['w-full'] : []),
  ].join(' '),
)

const contentClasses = computed(() => BUTTON_CONTENT_GAP[props.size])

const spinnerClasses = computed(() => BUTTON_SPINNER_SIZE[props.size])
</script>
