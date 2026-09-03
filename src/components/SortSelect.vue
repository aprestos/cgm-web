<script setup lang="ts" generic="T extends string">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { IconArrowsSort, IconCheck } from '@tabler/icons-vue'

interface SortOptionItem<T extends string = string> {
  value: T
  label: string
}

const props = defineProps<{
  modelValue: T
  // "Sort by" — also the button's accessible name once the labels collapse.
  label: string
  options: SortOptionItem<T>[]
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()

const selectedLabel = (): string =>
  props.options.find((option) => option.value === props.modelValue)?.label ?? ''
</script>

<template>
  <!-- The toolbar copy of the sort control: sort is reached far more often
       than the filters, so it stays in reach instead of moving into the panel.
       Icon only until there is room for the labels. -->
  <Listbox
    :model-value="modelValue"
    class="h-full"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="relative h-full">
      <ListboxButton
        class="relative h-full w-full cursor-pointer rounded-full bg-gray-100 pl-12 pr-10 text-left focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:focus:border-primary-400 dark:focus:ring-primary-400"
      >
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <IconArrowsSort
            class="size-6 text-gray-400 dark:text-gray-300"
            aria-hidden="true"
          />
        </span>
        <span class="sr-only">{{ label }}</span>
        <span class="hidden flex-col justify-center md:flex" aria-hidden="true">
          <span class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">
            {{ label }}
          </span>
          <span
            class="block truncate text-base font-medium text-gray-900 dark:text-white"
          >
            {{ selectedLabel() }}
          </span>
        </span>
        <span
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
        >
          <ChevronDownIcon class="size-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <ListboxOptions
          class="absolute right-0 z-10 mt-1 max-h-60 w-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-700"
        >
          <ListboxOption
            v-for="option in options"
            :key="option.value"
            v-slot="{ active, selected }"
            :value="option.value"
            as="template"
          >
            <li
              :class="[
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-900 dark:text-white',
                'relative flex cursor-pointer select-none flex-row py-2 pl-3 pr-9',
              ]"
            >
              <span
                :class="[
                  selected ? 'font-semibold' : 'font-normal',
                  'block truncate',
                ]"
              >
                {{ option.label }}
              </span>

              <IconCheck
                v-if="selected"
                :class="[
                  active ? 'text-white' : 'text-primary-600',
                  'absolute right-0 mr-4 size-5',
                ]"
              />
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<style scoped></style>
