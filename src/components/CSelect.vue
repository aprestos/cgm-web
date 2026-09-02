<template>
  <div class="col-span-full">
    <label v-if="label" :for="id" :class="LABEL_CLASSES">
      {{ label }}
      <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
    </label>
    <Listbox
      :model-value="selectedOption"
      :by="compareOptions"
      :disabled="disabled"
      @update:model-value="handleSelect"
    >
      <div class="relative" :class="{ 'mt-2': label }">
        <ListboxButton
          :id="id"
          :class="buttonClasses"
          :aria-invalid="hasErrors || undefined"
          :aria-describedby="describedBy"
        >
          <span
            class="block truncate"
            :class="selectedOption ? '' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ selectedOption?.label ?? placeholder }}
            <span
              v-if="selectedOption?.secondaryLabel"
              class="ml-1 text-gray-500 dark:text-gray-400"
            >
              {{ selectedOption.secondaryLabel }}
            </span>
          </span>
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>
        <!-- Sits on top of the trigger rather than inside it: a button cannot
             nest in a button. Same right-8 slot as CCombobox's clear. -->
        <button
          v-if="showClear"
          type="button"
          tabindex="-1"
          class="absolute cursor-pointer inset-y-0 right-8 flex items-center pr-2 hover:text-gray-600 dark:hover:text-gray-300 z-10"
          @click.stop.prevent="handleClear"
        >
          <span class="sr-only">{{ t('common.actions.clear') }}</span>
          <XMarkIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <ListboxOptions :class="[FIELD_PANEL, FIELD_RADIUS]">
            <div
              v-if="items.length === 0"
              class="relative cursor-default select-none px-4 py-2 text-gray-600 dark:text-gray-300"
            >
              {{ emptyText }}
            </div>
            <ListboxOption
              v-for="item in items"
              :key="getItemKey(item)"
              v-slot="{ selected: isSelected, active }"
              as="template"
              :value="item"
            >
              <CSelectOption
                :option="item"
                :selected="isSelected"
                :active="active"
              >
                <!-- Forwarded only when the caller supplies it, so the plain
                     label stays CSelectOption's own fallback. `#option` fills
                     the label area; the row chrome is not up for grabs. -->
                <template v-if="$slots.option" #default>
                  <slot
                    name="option"
                    :option="item"
                    :selected="isSelected"
                    :active="active"
                  />
                </template>
              </CSelectOption>
            </ListboxOption>
          </ListboxOptions>
        </TransitionRoot>
      </div>
    </Listbox>
    <p v-if="helperText" :id="`${id}-helper`" :class="HELPER_CLASSES">
      {{ helperText }}
    </p>
    <ValidationErrors v-if="errors" :id="`${id}-error`" :errors="errors" />
  </div>
</template>

<script lang="ts" setup generic="T">
import { computed } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { useI18n } from 'vue-i18n'
import ValidationErrors from '@/components/ValidationErrors.vue'
import CSelectOption from '@/components/CSelectOption.vue'
import type { Option } from '@/components/select.types'
import {
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_ICON_PAD_RIGHT,
  FIELD_PANEL,
  FIELD_RADIUS,
  FIELD_SIZE,
  FIELD_STATE,
  HELPER_CLASSES,
  LABEL_CLASSES,
  type FieldSize,
} from '@/components/field.styles'

/**
 * Pick-one-from-a-short-list select: a button that opens the full list, with
 * no text entry. Use it whenever the user can take in every option at a glance
 * (roles, formats, a handful of locations). Once the set is remote or too long
 * to scan, switch to CCombobox, which filters as you type.
 *
 * The trigger wears FIELD_BASE/FIELD_STATE rather than CCombobox's shell
 * classes, because here the focusable element *is* the box — there is no inner
 * input to delegate focus to, so plain `focus:` beats `focus-within:`.
 */
interface Props {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  modelValue?: T | null
  items: Array<Option<T>>
  /** Shown, in placeholder grey, while nothing is selected. */
  placeholder?: string
  /** Shown in place of the list when `items` is empty. */
  emptyText?: string
  label?: string
  errors?: string[]
  helperText?: string
  size?: FieldSize
  disabled?: boolean
  required?: boolean
  /** Adds an X to return to the empty selection. Optional fields want it. */
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select an option',
  emptyText: 'No options available',
  label: undefined,
  errors: undefined,
  helperText: undefined,
  size: 'md',
  disabled: false,
  required: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: T | null] // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
}>()

const { t } = useI18n()

const hasErrors = computed(() => !!props.errors && props.errors.length > 0)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.helperText) ids.push(`${props.id}-helper`)
  if (hasErrors.value) ids.push(`${props.id}-error`)
  return ids.length ? ids.join(' ') : undefined
})

const selectedOption = computed(
  () => props.items.find((item) => item.value === props.modelValue) ?? null,
)

const showClear = computed(
  () => props.clearable && !!selectedOption.value && !props.disabled,
)

// The trailing padding has to clear one icon, or two once the X appears; both
// are emitted after the size map's px-*, so they win.
const buttonClasses = computed(() => [
  FIELD_BASE,
  FIELD_DISABLED,
  FIELD_SIZE[props.size],
  FIELD_RADIUS,
  'relative cursor-pointer text-left',
  showClear.value ? 'pr-16' : FIELD_ICON_PAD_RIGHT[props.size],
  hasErrors.value ? FIELD_STATE.error : FIELD_STATE.default,
])

function compareOptions(a: Option<T> | null, b: Option<T> | null): boolean {
  return a?.value === b?.value
}

function handleSelect(option: Option<T> | null): void {
  emit('update:modelValue', option?.value ?? null)
}

function handleClear(): void {
  emit('update:modelValue', null)
}

const getItemKey = (item: Option<T>): string | number => {
  if (
    typeof item.value === 'object' &&
    item.value !== null &&
    'id' in item.value
  ) {
    return (item.value as { id: string | number }).id
  }
  return item.label
}
</script>
