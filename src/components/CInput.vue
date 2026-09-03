<template>
  <div class="col-span-full" :class="[$attrs.class, wrapperClass]">
    <label v-if="label" :for="id" :class="LABEL_CLASSES">
      {{ label }}
      <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
    </label>
    <!-- The offset only separates the field from its label. Without one it is
         dropped, so a bare field sits flush with a sibling button in a flex
         row (the settings "add category" rows) or a toolbar. -->
    <div class="relative" :class="{ 'mt-2': label }">
      <div
        v-if="hasIconLeft"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center text-gray-400 dark:text-gray-500"
        :class="[iconInsetLeft, iconSizeClass]"
      >
        <slot name="icon-left">
          <component :is="iconLeft" v-if="iconLeft" />
        </slot>
      </div>

      <!-- The clear button takes the right-hand slot when both are present. -->
      <div
        v-if="showClear"
        class="absolute inset-y-0 right-0 flex items-center"
        :class="[iconInsetRight, iconSizeClass]"
      >
        <button
          type="button"
          class="cursor-pointer rounded-md text-gray-400 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:outline-primary-500"
          @click="onClear"
        >
          <span class="sr-only">{{ t('common.actions.clear') }}</span>
          <IconX aria-hidden="true" />
        </button>
      </div>
      <div
        v-else-if="hasIconRight"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400 dark:text-gray-500"
        :class="[iconInsetRight, iconSizeClass]"
      >
        <slot name="icon-right">
          <component :is="iconRight" v-if="iconRight" />
        </slot>
      </div>

      <input
        :id="id"
        ref="inputEl"
        v-bind="inputAttrs"
        :name="name || id"
        :type="type"
        :placeholder="placeholder"
        :value="localValue"
        :min="min"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="hasErrors || undefined"
        :aria-describedby="describedBy"
        :class="inputClasses"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
        @keydown.enter="flush"
      />
    </div>
    <p v-if="helperText" :id="`${id}-helper`" :class="HELPER_CLASSES">
      {{ helperText }}
    </p>
    <ValidationErrors v-if="errors" :id="`${id}-error`" :errors="errors" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, ref, useAttrs, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconX } from '@tabler/icons-vue'
import ValidationErrors from '@/components/ValidationErrors.vue'
import {
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_ICON_INSET_LEFT,
  FIELD_ICON_INSET_RIGHT,
  FIELD_ICON_PAD_LEFT,
  FIELD_ICON_PAD_RIGHT,
  FIELD_ICON_SIZE,
  FIELD_RADIUS,
  FIELD_RADIUS_PILL,
  FIELD_SIZE,
  FIELD_STATE,
  type FieldSize,
  HELPER_CLASSES,
  LABEL_CLASSES,
} from '@/components/field.styles'

defineOptions({ inheritAttrs: false })

interface Props {
  id: string
  label?: string
  modelValue: string
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'time'
    | 'search'
    | 'tel'
    | 'url'
  placeholder?: string
  name?: string
  errors?: string[]
  /** @deprecated pass `class` directly — it lands on the same wrapper. */
  wrapperClass?: string
  helperText?: string
  min?: string | number
  size?: FieldSize
  /** Pill shape, for search fields. */
  rounded?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  /** Milliseconds to delay `update:modelValue`. 0 emits synchronously. */
  debounce?: number
  /** Shorthand for the icon slots; the slots win when both are given. */
  iconLeft?: Component
  iconRight?: Component
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  type: 'text',
  placeholder: '',
  name: undefined,
  errors: undefined,
  wrapperClass: '',
  helperText: undefined,
  min: undefined,
  size: 'md',
  rounded: false,
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  debounce: 0,
  iconLeft: undefined,
  iconRight: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [value: string]
  focus: [value: string]
  clear: []
}>()

const { t } = useI18n()
const attrs = useAttrs()
const slots = useSlots()
const inputEl = ref<HTMLInputElement | null>(null)

// `class`/`style` are peeled off so they stay on the wrapper (call sites pass
// grid placement like `sm:col-span-6` there); the rest (step, autocomplete,
// maxlength, inputmode, @keyup.enter, ...) reaches the input.
//
// The template root must stay a single element — even a leading comment would
// make this a fragment, and the wrapper `class` would then have nowhere to go.
const inputAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  ),
)

const hasErrors = computed(() => !!props.errors && props.errors.length > 0)
const hasIconLeft = computed(() => !!slots['icon-left'] || !!props.iconLeft)
const hasIconRight = computed(() => !!slots['icon-right'] || !!props.iconRight)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.helperText) ids.push(`${props.id}-helper`)
  if (hasErrors.value) ids.push(`${props.id}-error`)
  return ids.length ? ids.join(' ') : undefined
})

// Local copy so typing stays instant even while the emit is debounced.
const localValue = ref(props.modelValue)
watch(
  () => props.modelValue,
  (value) => {
    if (value !== localValue.value) localValue.value = value
  },
)

// A hand-rolled timer rather than useDebounceFn, because the emit has to be
// flushable: blurring or pressing Enter must not drop the last keystroke.
// cart.store.ts debounces the same way.
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function scheduleEmit(value: string): void {
  clearTimer()
  // Not `useDebounceFn(fn, 0)` — that still defers by a tick, which would break
  // v-model for every non-debounced call site.
  if (!props.debounce) {
    emit('update:modelValue', value)
    return
  }
  timer = setTimeout(() => {
    timer = null
    emit('update:modelValue', value)
  }, props.debounce)
}

function flush(): void {
  if (timer !== null) {
    clearTimer()
    emit('update:modelValue', localValue.value)
  }
}

onBeforeUnmount(clearTimer)

const showClear = computed(
  () => props.clearable && !!localValue.value && !props.disabled,
)

const iconInsetLeft = computed(() => FIELD_ICON_INSET_LEFT[props.size])
const iconInsetRight = computed(() => FIELD_ICON_INSET_RIGHT[props.size])
const iconSizeClass = computed(() => FIELD_ICON_SIZE[props.size])

const inputClasses = computed(() => [
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_SIZE[props.size],
  props.rounded ? FIELD_RADIUS_PILL : FIELD_RADIUS,
  hasIconLeft.value ? FIELD_ICON_PAD_LEFT[props.size] : '',
  hasIconRight.value || showClear.value ? FIELD_ICON_PAD_RIGHT[props.size] : '',
  hasErrors.value ? FIELD_STATE.error : FIELD_STATE.default,
])

function onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  localValue.value = value
  scheduleEmit(value)
}

function onBlur(e: Event): void {
  flush()
  emit('blur', (e.target as HTMLInputElement).value)
}

function onFocus(e: Event): void {
  emit('focus', (e.target as HTMLInputElement).value)
}

function onClear(): void {
  clearTimer()
  localValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputEl.value?.focus()
}
</script>
