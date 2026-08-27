<template>
  <div class="col-span-full">
    <label
      v-if="label"
      :for="id"
      class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
    >
      {{ label }}
    </label>
    <div class="mt-2">
      <textarea
        :id="id"
        :name="name || id"
        :rows="rows"
        :placeholder="placeholder"
        :value="modelValue"
        :class="[
          'block w-full rounded-md bg-white px-3 py-1.5 text-base dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6',
          errors && errors.length > 0
            ? 'outline-red-300 focus:outline-red-600 dark:outline-red-400 dark:focus:outline-red-500'
            : 'outline-gray-300 focus:outline-primary-600 dark:outline-white/10 dark:focus:outline-primary-500',
        ]"
        @input="
          $emit(
            'update:modelValue',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      />
      <p
        v-if="helperText"
        class="text-xs mt-1 text-gray-600 dark:text-gray-400"
      >
        {{ helperText }}
      </p>
    </div>
    <ValidationErrors v-if="errors" :errors="errors" />
  </div>
</template>

<script setup lang="ts">
import ValidationErrors from '@/components/ValidationErrors.vue'

interface Props {
  id: string
  label?: string
  modelValue: string
  rows?: number
  placeholder?: string
  name?: string
  errors?: string[]
  helperText?: string
}

withDefaults(defineProps<Props>(), {
  label: undefined,
  rows: 4,
  placeholder: '',
  name: undefined,
  errors: undefined,
  helperText: undefined,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
