<template>
  <div class="relative">
    <div
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
    >
      <IconSearch class="h-5 w-5 text-gray-400" aria-hidden="true" />
    </div>
    <input
      :value="modelValue"
      type="search"
      placeholder="Search settings..."
      class="block w-full rounded-md border-0 bg-white py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @keydown.esc="$emit('update:modelValue', '')"
    />
    <div
      v-if="modelValue"
      class="absolute inset-y-0 right-0 flex items-center pr-3"
    >
      <button
        type="button"
        class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
        @click="$emit('update:modelValue', '')"
      >
        <span class="sr-only">Clear search</span>
        <IconX class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconSearch, IconX } from '@tabler/icons-vue'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
