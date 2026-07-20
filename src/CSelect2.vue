<template>
  <div class="col-span-full">
    <label
      v-if="label"
      class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
    >
      {{ label }}
    </label>
    <Combobox
      :model-value="selectedOption"
      :by="compareOptions"
      @update:model-value="handleSelect"
    >
      <div class="relative mt-2" @keydown.capture="handleKeydownCapture">
        <div
          :class="[
            'relative w-full cursor-default overflow-hidden rounded-md bg-white dark:bg-white/5 text-left outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 sm:text-sm',
            errors && errors.length > 0
              ? 'outline-red-300 focus-within:outline-red-600 dark:outline-red-400 dark:focus-within:outline-red-500'
              : 'outline-gray-300 dark:outline-white/10 focus-within:outline-indigo-600 dark:focus-within:outline-indigo-500',
          ]"
        >
          <ComboboxInput
            class="w-full border-none py-1.5 pl-3 pr-16 text-base sm:text-sm/6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 bg-transparent outline-none"
            :display-value="getDisplayValue"
            :placeholder="placeholder"
            @change="handleQueryChange"
          />
          <button
            v-if="selectedOption"
            type="button"
            tabindex="-1"
            class="absolute cursor-pointer inset-y-0 right-8 flex items-center pr-2 hover:text-gray-600 dark:hover:text-gray-300 z-10"
            @click.stop.prevent="handleClear"
            @mousedown.stop.prevent="handleClear"
          >
            <XMarkIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
          </button>
          <ComboboxButton
            class="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions
            class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-gray-200 dark:ring-white/10 focus:outline-none sm:text-sm"
          >
            <div
              v-if="isLoading"
              class="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300"
            >
              <span class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            </div>
            <div
              v-else-if="!isLoading && displayItems.length === 0"
              class="relative cursor-default select-none px-4 py-2 text-gray-600 dark:text-gray-300"
            >
              {{
                query !== '' ? 'Nothing found.' : 'Start typing to show results'
              }}
            </div>

            <ComboboxOption
              v-for="item in displayItems"
              :key="getItemKey(item)"
              v-slot="{ selected: isSelected, active }"
              as="template"
              :value="item"
            >
              <li
                class="group relative cursor-pointer select-none py-2 pl-10 pr-4"
                :class="
                  active
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'text-gray-900 dark:text-gray-100'
                "
              >
                <span
                  class="block truncate"
                  :class="isSelected ? 'font-medium' : 'font-normal'"
                >
                  {{ getItemLabel(item) }}
                  <span
                    v-if="getItemSecondaryLabel(item)"
                    class="ml-1 group-[.bg-indigo-600]:text-indigo-100 dark:group-[.bg-indigo-500]:text-indigo-100 text-gray-500 dark:text-gray-400"
                  >
                    {{ getItemSecondaryLabel(item) }}
                  </span>
                </span>
                <span
                  class="absolute inset-y-0 left-0 flex items-center pl-3"
                  :class="
                    isSelected
                      ? 'group-[.bg-indigo-600]:text-white dark:group-[.bg-indigo-500]:text-white text-indigo-600 dark:text-indigo-500'
                      : 'text-gray-300 dark:text-gray-600'
                  "
                >
                  <IconCheck class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>
    <p v-if="helperText" class="text-xs mt-1 text-gray-600 dark:text-gray-400">
      {{ helperText }}
    </p>
    <ValidationErrors v-if="errors" :errors="errors" />
  </div>
</template>

<script lang="ts" setup generic="T">
import { ref, shallowRef, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { useDebounceFn } from '@vueuse/core'
import { IconCheck } from '@tabler/icons-vue'
import ValidationErrors from '@/components/ValidationErrors.vue'

export interface Option<TValue> {
  value: TValue
  label: string
  secondaryLabel?: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  modelValue?: T | null
  items?: Array<Option<T>>
  searchFn?: (query: string, signal?: AbortSignal) => Promise<Array<Option<T>>>
  placeholder?: string
  label?: string
  errors?: string[]
  helperText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  items: () => [],
  searchFn: undefined,
  placeholder: 'Type to search',
  label: undefined,
  errors: undefined,
  helperText: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: T | null] // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
}>()

const query = ref('')
const isLoading = ref(false)
const searchResults = shallowRef<Array<Option<T>>>([])
// Remembers the last picked option so the selection keeps displaying even
// after searchResults change (new search, dropdown reopened, ...)
const lastSelected = shallowRef<Option<T> | null>(null)
let abortController: AbortController | null = null

// Computed: Find selected option based on modelValue
const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return null

  const allItems = props.searchFn ? searchResults.value : props.items
  const found = allItems.find((item) => item.value === props.modelValue)
  if (found) return found

  return lastSelected.value?.value === props.modelValue
    ? lastSelected.value
    : null
})

function compareOptions(a: Option<T> | null, b: Option<T> | null): boolean {
  return a?.value === b?.value
}

// Computed: Items to display in dropdown
const displayItems = computed(() => {
  if (props.searchFn) {
    return searchResults.value
  }

  if (!props.items?.length) return []

  if (!query.value) return props.items

  const searchTerm = query.value.toLowerCase().replace(/\s+/g, '')
  return props.items.filter((item) =>
    item.label.toLowerCase().replace(/\s+/g, '').includes(searchTerm),
  )
})

// Update query and loading state immediately on every keystroke so the
// dropdown gives instant feedback; only the remote search is debounced.
function handleQueryChange(event: Event): void {
  const target = event.target as HTMLInputElement
  query.value = target.value

  if (!props.searchFn) return

  if (!query.value.length) {
    abortController?.abort()
    abortController = null
    isLoading.value = false
    searchResults.value = []
    return
  }

  isLoading.value = true
  void debouncedSearch()
}

const debouncedSearch = useDebounceFn(async () => {
  if (!props.searchFn || !query.value.length) return

  // Abort previous request
  abortController?.abort()
  abortController = new AbortController()
  const currentController = abortController

  try {
    const results = await props.searchFn(query.value, currentController.signal)

    if (currentController === abortController) {
      searchResults.value = results
    }
  } catch (error) {
    if (
      currentController === abortController &&
      (error as Error).name !== 'AbortError'
    ) {
      console.error('Search error:', error)
      searchResults.value = []
    }
  } finally {
    if (currentController === abortController) {
      isLoading.value = false
    }
  }
}, 300)

// While a search is in flight, Enter would make Headless UI close the
// dropdown without selecting anything (no active option yet) — swallow it
// so the user can pick once the results arrive.
function handleKeydownCapture(event: KeyboardEvent): void {
  if (event.key === 'Enter' && isLoading.value) {
    event.preventDefault()
    event.stopPropagation()
  }
}

// Handle selection
function handleSelect(option: Option<T> | null): void {
  lastSelected.value = option
  emit('update:modelValue', option?.value ?? null)
}

// Handle clear
function handleClear(): void {
  query.value = ''
  searchResults.value = []
  lastSelected.value = null
  emit('update:modelValue', null)
}

// Display functions
const getDisplayValue = (item: unknown): string =>
  (item as Option<T> | null)?.label ?? ''

const getItemLabel = (item: unknown): string => (item as Option<T>).label

const getItemSecondaryLabel = (item: unknown): string | undefined =>
  (item as Option<T>).secondaryLabel

const getItemKey = (item: unknown): string | number => {
  const option = item as Option<T>
  if (
    typeof option.value === 'object' &&
    option.value !== null &&
    'id' in option.value
  ) {
    return (option.value as { id: string | number }).id
  }
  return option.label
}
</script>
