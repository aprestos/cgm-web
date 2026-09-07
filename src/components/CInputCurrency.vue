<template>
  <CInput
    :id="id"
    :label="label"
    :model-value="displayValue"
    type="text"
    :placeholder="placeholder"
    :name="name"
    :errors="errors"
    :wrapper-class="wrapperClass"
    :helper-text="helperText"
    :min="min"
    @update:model-value="onInput"
    @blur="onBlur"
    @focus="onFocus"
  >
    <template #icon-left>
      <component :is="currencyIcon" v-if="currencyIcon" class="size-4" />
    </template>
  </CInput>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CInput from '@/components/CInput.vue'
import { useEditionStore } from '@/features/events/edition.store'
import { getCurrencyIcon } from '@/composables/useCurrency.ts'

const editionStore = useEditionStore()

interface Props {
  id: string
  label?: string
  modelValue: string
  placeholder?: string
  name?: string
  errors?: string[]
  wrapperClass?: string
  helperText?: string
  min?: string | number
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  placeholder: '',
  name: undefined,
  errors: undefined,
  wrapperClass: '',
  helperText: undefined,
  min: undefined,
  currency: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [value: string]
}>()

const isFocused = ref(false)

const currencyIcon = computed(() => {
  const curr = props.currency || editionStore.edition?.currency || ''
  return getCurrencyIcon(curr)
})

const displayValue = computed(() => {
  // When focused, show raw value for editing
  if (isFocused.value) {
    return props.modelValue
  }

  // When not focused, format according to user's locale
  if (props.modelValue) {
    const num = parseFloat(props.modelValue)
    if (!Number.isNaN(num)) {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }
  }

  return props.modelValue
})

function onInput(value: string): void {
  // Remove any non-numeric characters except dots and commas
  const sanitized = value.replace(/[^0-9.,]/g, '')
  // Normalize to dots (database format)
  const normalized = sanitized.replace(/,/g, '.')
  // Only keep first decimal separator
  const parts = normalized.split('.')
  const cleaned =
    parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : normalized

  emit('update:modelValue', cleaned)
}

function onFocus(): void {
  isFocused.value = true
}

function onBlur(value: string): void {
  isFocused.value = false

  let formattedValue = value
  if (value) {
    // Parse and format to standard database format (dot as decimal separator, 2 decimals)
    const num = parseFloat(value.replace(/,/g, '.'))
    if (!Number.isNaN(num)) {
      formattedValue = num.toFixed(2)
      // Only emit if value changed
      if (formattedValue !== props.modelValue) {
        emit('update:modelValue', formattedValue)
      }
    }
  }
  emit('blur', formattedValue)
}
</script>
