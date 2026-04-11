<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { ref } from 'vue'
import VueSelect, { type Option } from 'vue3-select-component'

interface Props<T = any> {
  modelValue?: string | number | object | unknown[] | null
  placeholder?: string
  optionValue?: string
  optionLabel?: string
  optionSecondaryLabel?: string
  onSearch?: (query: string) => Promise<Array<T>>
}

const props = defineProps<Props>()

const isLoading = ref<boolean>(false)
const options = ref<Option<string>[]>([])

// Set defaults
const { placeholder = 'Select an option' } = props

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
}>()

function onUpdate(value: unknown): void {
  emit('update:modelValue', value)
}

const handleSearch = useDebounceFn(async (value) => {
  if (!props.onSearch) return

  isLoading.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (value?.length > 1) {
      const result = await props.onSearch(value)
      if (!Array.isArray(result)) {
        return
      }
      options.value = result.map((item) => {
        // Type assertion to access properties safely
        const typedItem = item as Record<string, any>
        return {
          value: typedItem[props.optionValue || 'value'],
          label: typedItem[props.optionLabel || 'label'],
          secondaryLabel: typedItem[props.optionSecondaryLabel || 'label'],
        } as unknown as Option<string>
      })
    }
  } finally {
    isLoading.value = false
  }
}, 300)
</script>

<template>
  <VueSelect
    :model-value="modelValue"
    :is-searchable="true"
    :options="options"
    :placeholder="placeholder"
    :is-loading="isLoading"
    :classes="{
      container: 'w-full',
      control:
        '!w-full !rounded-md !bg-white !outline-1 !-outline-offset-1 !outline-gray-300 focus:!outline-2 focus:!-outline-offset-2 focus:!outline-indigo-600 !border-0 focus:!border-0 focus-within:!outline-2 focus-within:!-outline-offset-2 focus-within:!outline-indigo-600',
      valueContainer: '!px-3 !py-1.5',
      placeholder: '!text-base !text-gray-400 sm:!text-sm/6',
      singleValue: '!text-base !text-gray-900 sm:!text-sm/6',
      multiValue: 'bg-blue-100 rounded-md',
      multiValueLabel: 'text-blue-800 px-2 py-1',
      multiValueRemove: 'hover:bg-blue-200 px-2',
      inputContainer: '',
      searchInput:
        '!text-base !text-gray-900 placeholder:!text-gray-400 sm:!text-sm/6',
      menuContainer:
        'mt-1 border border-gray-200 rounded-md shadow-lg bg-white z-50',
      menuOption: 'px-3 py-2 hover:bg-gray-100 text-gray-900',
      //menuOptionFocused: 'bg-indigo-600 text-white',
      noResults: 'text-gray-500 p-3',
      taggableNoOptions: 'text-indigo-600 p-3 hover:bg-indigo-50',
      //loadingSpinner: 'text-indigo-600',
    }"
    @update:model-value="onUpdate"
    @search="handleSearch"
  >
    <template #option="{ option }">
      <div class="flex flex-col">
        <span class="font-medium">{{ option.label }}</span>
        <small v-if="option.secondaryLabel" class="text-gray-500">{{
          option.secondaryLabel
        }}</small>
      </div>
    </template>
  </VueSelect>
</template>

<style scoped></style>
