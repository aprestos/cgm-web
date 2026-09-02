<template>
  <CInput
    :id="id"
    :model-value="modelValue"
    type="search"
    :placeholder="placeholder"
    :label="label"
    :size="size"
    :rounded="rounded"
    :debounce="debounce"
    :icon-left="IconSearch"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
    @keydown.esc="$emit('update:modelValue', '')"
  />
</template>

<script setup lang="ts">
import { IconSearch } from '@tabler/icons-vue'
import CInput from '@/components/CInput.vue'
import type { FieldSize } from '@/components/field.styles'

// Behaviour only — every visual decision lives in CInput.
interface Props {
  modelValue: string
  id?: string
  placeholder?: string
  label?: string
  size?: FieldSize
  rounded?: boolean
  debounce?: number
}

withDefaults(defineProps<Props>(), {
  id: 'search',
  placeholder: undefined,
  label: undefined,
  size: 'md',
  rounded: false,
  debounce: 300,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
