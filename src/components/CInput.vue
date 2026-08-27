<template>
  <div class="col-span-full" :class="wrapperClass">
    <label
      v-if="label"
      :for="id"
      class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
    >
      {{ label }}
    </label>
    <div class="mt-2 relative">
      <!-- Left Icon Slot -->
      <div
        v-if="$slots['icon-left']"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <slot name="icon-left" />
      </div>
      <!-- Right Icon Slot -->
      <div
        v-if="$slots['icon-right']"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <slot name="icon-right" />
      </div>
      <input
        :id="id"
        :name="name || id"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :min="min"
        :class="[
          'block w-full rounded-md bg-white px-3 py-1.5 text-base dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6',
          $slots['icon-left'] ? 'pl-10' : '',
          $slots['icon-right'] ? 'pr-10' : '',
          errors && errors.length > 0
            ? 'outline-red-300 focus:outline-red-600 dark:outline-red-400 dark:focus:outline-red-500'
            : 'outline-gray-300 focus:outline-primary-600 dark:outline-white/10 dark:focus:outline-primary-500',
        ]"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      />
    </div>
    <p v-if="helperText" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ helperText }}
    </p>
    <ValidationErrors v-if="errors" :errors="errors" />
  </div>
</template>

<script setup lang="ts">
import ValidationErrors from '@/components/ValidationErrors.vue'

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
  placeholder?: string
  name?: string
  errors?: string[]
  wrapperClass?: string
  helperText?: string
  min?: string | number
}

withDefaults(defineProps<Props>(), {
  label: undefined,
  type: 'text',
  placeholder: '',
  name: undefined,
  errors: undefined,
  wrapperClass: '',
  helperText: undefined,
  min: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [value: string]
  focus: [value: string]
}>()

function onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function onBlur(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('blur', value)
}

function onFocus(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('focus', value)
}
</script>
