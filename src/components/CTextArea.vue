<template>
  <div class="col-span-full">
    <label v-if="label" :for="id" :class="LABEL_CLASSES">
      {{ label }}
      <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
    </label>
    <div :class="{ 'mt-2': label }">
      <textarea
        :id="id"
        :name="name || id"
        :rows="rows"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasErrors || undefined"
        :aria-describedby="describedBy"
        :class="textareaClasses"
        @input="
          $emit(
            'update:modelValue',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      />
      <p v-if="helperText" :id="`${id}-helper`" :class="HELPER_CLASSES">
        {{ helperText }}
      </p>
    </div>
    <ValidationErrors v-if="errors" :id="`${id}-error`" :errors="errors" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ValidationErrors from '@/components/ValidationErrors.vue'
import {
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_RADIUS,
  FIELD_SIZE,
  FIELD_STATE,
  HELPER_CLASSES,
  LABEL_CLASSES,
  type FieldSize,
} from '@/components/field.styles'

interface Props {
  id: string
  label?: string
  modelValue: string
  rows?: number
  placeholder?: string
  name?: string
  errors?: string[]
  helperText?: string
  size?: FieldSize
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  rows: 4,
  placeholder: '',
  name: undefined,
  errors: undefined,
  helperText: undefined,
  size: 'md',
  disabled: false,
  required: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const hasErrors = computed(() => !!props.errors && props.errors.length > 0)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.helperText) ids.push(`${props.id}-helper`)
  if (hasErrors.value) ids.push(`${props.id}-error`)
  return ids.length ? ids.join(' ') : undefined
})

const textareaClasses = computed(() => [
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_SIZE[props.size],
  FIELD_RADIUS,
  hasErrors.value ? FIELD_STATE.error : FIELD_STATE.default,
])
</script>
