<script setup lang="ts" generic="T extends string">
import { RadioGroup, RadioGroupLabel, RadioGroupOption } from '@headlessui/vue'

// Generic over the value type so a page keeps its own union or enum through
// the v-model instead of widening it to string.
export interface FilterRadioOption<T extends string = string> {
  value: T
  label: string
  // Shown after the label when the page can say how many rows match.
  count?: number
}

defineProps<{
  modelValue: T
  label: string
  options: FilterRadioOption<T>[]
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <!-- Radios rather than a dropdown or a tab strip: inside the panel there is
       room to show every option, and no popover over a popover. -->
  <RadioGroup
    :model-value="modelValue"
    class="px-4 py-6"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <RadioGroupLabel class="text-sm font-medium text-gray-900 dark:text-white">
      {{ label }}
    </RadioGroupLabel>

    <div class="mt-4 space-y-4">
      <RadioGroupOption
        v-for="option in options"
        :key="option.value"
        v-slot="{ checked }"
        :value="option.value"
        as="template"
      >
        <div
          class="flex cursor-pointer items-center gap-3 text-sm text-gray-600 focus:outline-none dark:text-gray-400"
        >
          <span
            class="grid size-4 shrink-0 place-content-center rounded-full border"
            :class="
              checked
                ? 'border-primary-600 bg-primary-600'
                : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-transparent'
            "
          >
            <span v-if="checked" class="size-1.5 rounded-full bg-white" />
          </span>
          <span class="flex-1">{{ option.label }}</span>
          <span v-if="option.count !== undefined" class="text-xs opacity-60">
            {{ option.count }}
          </span>
        </div>
      </RadioGroupOption>
    </div>
  </RadioGroup>
</template>

<style scoped></style>
