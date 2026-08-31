<template>
  <form>
    <h3 class="sr-only">{{ t('public.library.filters.title') }}</h3>

    <!-- Category Tags -->
    <ul role="list" class="py-3 font-medium text-gray-900 dark:text-white">
      <li v-for="category in subCategories" :key="category.id">
        <label
          :class="[
            'flex cursor-pointer items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700',
            {
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300':
                selectedTag === category.id,
            },
          ]"
        >
          <component
            :is="category.icon"
            :class="[
              'size-5 text-gray-400 dark:text-gray-300',
              {
                'text-primary-600 dark:text-primary-400':
                  selectedTag === category.id,
              },
            ]"
          />
          <span class="flex-1" @click="handleTagSelect(category.id)">
            {{ t(`public.library.filters.${category.id}`) }}
          </span>
        </label>
      </li>
    </ul>

    <!-- Filter Sections -->
    <Disclosure
      v-for="section in filters"
      :key="section.id"
      v-slot="{ open }"
      as="div"
      class="border-t border-gray-200 px-4 py-6 dark:border-gray-700"
    >
      <h3 class="-mx-2 -my-3 flow-root">
        <DisclosureButton
          class="flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400 hover:text-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
        >
          <span class="font-medium text-gray-900 dark:text-white">
            {{ t('public.library.filters.' + section.id) }}
          </span>
          <span class="ml-6 flex items-center">
            <PlusIcon v-if="!open" class="size-5" aria-hidden="true" />
            <MinusIcon v-else class="size-5" aria-hidden="true" />
          </span>
        </DisclosureButton>
      </h3>
      <DisclosurePanel class="pt-6">
        <div class="space-y-6">
          <div
            v-for="(option, optionIdx) in section.options"
            :key="option.value"
            class="flex gap-3"
          >
            <div class="flex h-5 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  :id="`filter-${section.id}-${optionIdx}`"
                  :name="`${section.id}[]`"
                  :value="option.value"
                  type="checkbox"
                  :checked="isFilterSelected(section.id, option.value)"
                  class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 indeterminate:border-primary-600 indeterminate:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                  @change="handleToggleFilter(section.id, option.value, $event)"
                />
                <svg
                  class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    class="opacity-0 group-has-checked:opacity-100"
                    d="M3 8L6 11L11 3.5"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    class="opacity-0 group-has-indeterminate:opacity-100"
                    d="M3 7H11"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
            <label
              :for="`filter-${section.id}-${optionIdx}`"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              {{ option.label }}
            </label>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { MinusIcon, PlusIcon } from '@heroicons/vue/20/solid'
import type { Component } from 'vue'

interface Props {
  selectedTag: string
  selectedFilters: Record<string, string[]>
  subCategories: Array<{ id: string; href: string; icon: Component }>
  filters: Array<{
    id: string
    options: Array<{ value: string; label: string; checked: boolean }>
  }>
}

interface Emits {
  (e: 'select-tag', tagId: string): void
  (e: 'toggle-filter', sectionId: string, value: string, event: Event): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleTagSelect = (tagId: string): void => {
  emit('select-tag', tagId)
}

const handleToggleFilter = (
  sectionId: string,
  value: string,
  event: Event,
): void => {
  emit('toggle-filter', sectionId, value, event)
}

const isFilterSelected = (sectionId: string, value: string): boolean => {
  return props.selectedFilters[sectionId]?.includes(value) || false
}
</script>
