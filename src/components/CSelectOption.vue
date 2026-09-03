<template>
  <li
    class="relative cursor-pointer select-none py-2 pl-4 pr-10"
    :class="[
      active ? 'bg-gray-100 dark:bg-white/10' : '',
      selected
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-900 dark:text-gray-100',
    ]"
  >
    <slot :option="option" :selected="selected" :active="active">
      <span
        class="block truncate"
        :class="selected ? 'font-medium' : 'font-normal'"
      >
        {{ option.label }}
        <span
          v-if="option.secondaryLabel"
          class="ml-1"
          :class="
            selected
              ? 'text-primary-500 dark:text-primary-400/80'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          {{ option.secondaryLabel }}
        </span>
      </span>
    </slot>
    <span
      v-if="selected"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 dark:text-primary-400"
    >
      <IconCheck class="h-5 w-5" aria-hidden="true" />
    </span>
  </li>
</template>

<script setup lang="ts" generic="T">
import { IconCheck } from '@tabler/icons-vue'
import type { Option } from '@/components/select.types'

/**
 * One row of a CSelect / CCombobox dropdown. Rendered as the `as="template"`
 * child of ListboxOption / ComboboxOption, so Headless UI's attrs and
 * listeners fall through to the single root `<li>` — keep it single-rooted and
 * leave `inheritAttrs` alone.
 *
 * The two states are deliberately on separate visual channels so both can be
 * read at once: `active` (hover / keyboard cursor) is a neutral tint, while
 * `selected` is the primary colour plus the trailing check. Painting `active`
 * with a solid primary fill, as this used to, made hovering the selected row
 * hide the very feedback the check is there to give.
 */
defineProps<{
  option: Option<T>
  selected: boolean
  active: boolean
}>()
</script>
