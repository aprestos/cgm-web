<template>
  <div class="w-full py-4">
    <TabGroup :selected-index="selectedTab" @change="handleTabChange">
      <TabList
        class="flex space-x-1 rounded-xl bg-primary-50 dark:bg-gray-900 p-1"
      >
        <Tab
          v-for="(tab, idx) in tabs"
          :key="idx"
          v-slot="{ selected }"
          as="template"
        >
          <button
            :class="[
              'flex flex-row justify-center w-full cursor-pointer rounded-lg py-2.5 text-sm font-medium leading-5',
              'bg-primary-50 dark:bg-gray-900 ring-offset-2 ring-offset-primary-50 dark:ring-offset-white/40',
              selected
                ? 'bg-primary-600 dark:bg-primary-700 text-white shadow'
                : 'text-gray-500 hover:bg-white hover:dark:bg-gray-800',
            ]"
          >
            <component
              :is="tab.icon"
              v-if="tab.icon"
              class="mr-2 size-5"
              aria-hidden="true"
            />
            {{ tab.label }}
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-2">
        <TabPanel
          v-for="(tab, idx) in tabs"
          :key="`panel-${idx}`"
          :class="['px-1 py-3']"
        >
          <slot :name="`tab-${idx}`" :tab="tab" :index="idx" />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import type { Component } from 'vue'

export interface TabConfig {
  label: string
  icon?: Component
}

interface Props {
  tabs: TabConfig[]
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'tab-change': [index: number]
}>()

const selectedTab = ref<number>(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    selectedTab.value = newValue
  },
)

const handleTabChange = (index: number): void => {
  selectedTab.value = index
  emit('update:modelValue', index)
  emit('tab-change', index)
}

// Expose selected tab for parent access
defineExpose({
  selectedTab,
})
</script>
