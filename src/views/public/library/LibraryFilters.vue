<template>
  <form>
    <h3 class="sr-only">{{ t('public.library.filters.title') }}</h3>

    <!-- Category Tags -->
    <ul
      role="list"
      :class="[
        isMobile
          ? 'py-3 font-medium text-gray-900 dark:text-white'
          : 'border-b border-gray-200 dark:border-gray-700 pb-6 text-sm font-medium text-gray-900 dark:text-white',
      ]"
    >
      <li v-for="category in subCategories" :key="category.id">
        <label
          :class="[
            'flex py-3 items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
            isMobile ? 'px-4' : '',
            {
              'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300':
                selectedTag === category.id,
            },
          ]"
        >
          <component
            :is="category.icon"
            :class="[
              isMobile ? 'h-5 w-5' : 'h-4 w-4',
              'text-gray-400 dark:text-gray-300',
              {
                'text-indigo-600 dark:text-indigo-400':
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
      :class="[
        isMobile
          ? 'border-t border-gray-200 dark:border-gray-700 px-4 py-6'
          : 'border-b border-gray-200 dark:border-gray-700 py-6',
      ]"
    >
      <h3 :class="isMobile ? '-mx-2 -my-3 flow-root' : '-my-3 flow-root'">
        <DisclosureButton
          :class="[
            'flex w-full items-center justify-between py-3 text-sm text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200',
            isMobile
              ? 'bg-white dark:bg-gray-800 px-2'
              : 'bg-white dark:bg-gray-900',
          ]"
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
        <div :class="isMobile ? 'space-y-6' : 'space-y-4'">
          <div
            v-for="(option, optionIdx) in section.options"
            :key="option.value"
            class="flex gap-3"
          >
            <div class="flex h-5 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  :id="`filter-${isMobile ? 'mobile' : 'desktop'}-${section.id}-${optionIdx}`"
                  :name="`${section.id}[]`"
                  :value="option.value"
                  type="checkbox"
                  :checked="isFilterSelected(section.id, option.value)"
                  class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
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
              :for="`filter-${isMobile ? 'mobile' : 'desktop'}-${section.id}-${optionIdx}`"
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
  isMobile?: boolean
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

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
})

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
