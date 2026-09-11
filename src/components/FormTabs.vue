<template>
  <div class="py-4">
    <TabGroup :selected-index="selectedTab" @change="handleTabChange">
      <!-- The track is `relative` so the indicator below can be positioned
           against it, and a grid rather than a flex row so every tab is
           exactly the same width whatever its label costs — which is what
           lets the indicator be placed with one translate.
           `w-fit` keeps the whole control hugging its labels instead of
           spanning the form: under fit-content sizing the `fr` columns settle
           at the widest tab's own width, so they stay equal to each other —
           which the indicator depends on — without stretching. `max-w-full`
           is the escape hatch for a narrow screen; the columns split evenly
           there too, and the labels truncate. -->
      <TabList
        :class="[
          FIELD_RADIUS,
          'relative grid w-fit max-w-full grid-flow-col auto-cols-fr gap-1 p-1',
          'bg-slate-600/10 dark:bg-white/5',
        ]"
      >
        <!-- One pill that slides, rather than a background painted on the
             selected tab: the movement is what tells you which way you just
             went. It sits under the labels (they are z-10), and is hidden
             from assistive tech — Headless UI already says which tab is
             selected. -->
        <span
          v-if="tabs.length"
          aria-hidden="true"
          class="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-primary-500"
          :style="indicatorStyle"
        />

        <Tab
          v-for="(tab, idx) in tabs"
          :key="idx"
          v-slot="{ selected }"
          as="template"
        >
          <button
            type="button"
            :class="[
              // Horizontal padding now sets how wide the control is, rather
              // than just insetting a label in a stretched column, so it runs
              // a step wider than it did full-width.
              'relative z-10 flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5',
              // Colour-only transition: the pill behind carries the movement,
              // so the label must not lag behind it.
              'transition-colors duration-150',
              // Same touch handling as CButton — no double-tap-zoom wait, no
              // grey flash painted over our own states.
              'touch-manipulation [-webkit-tap-highlight-color:transparent]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-500',
              selected
                ? 'text-black'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
            ]"
          >
            <component
              :is="tab.icon"
              v-if="tab.icon"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <!-- Truncates instead of wrapping: these live in dialogs, and a
                 wrapped label would grow the whole track by a line. -->
            <span class="truncate">{{ tab.label }}</span>
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-4">
        <!-- Headless UI makes the panel itself focusable; without this it
             draws the browser's outline on every click. The controls inside
             keep their own focus rings. -->
        <TabPanel
          v-for="(tab, idx) in tabs"
          :key="`panel-${idx}`"
          class="focus:outline-none"
        >
          <slot :name="`tab-${idx}`" :tab="tab" :index="idx" />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { FIELD_RADIUS } from '@/components/field.styles'

export interface TabConfig {
  label: string
  icon?: Component
}

interface Props {
  tabs: TabConfig[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'tab-change': [index: number]
}>()

const selectedTab = defineModel<number>({ default: 0 })

/**
 * The track's padding and column gap, in rem, mirroring the `p-1` and `gap-1`
 * classes above. The indicator is placed in JS, so the two have to agree —
 * change one and change the other.
 */
const TRACK_PADDING_REM = 0.25
const TRACK_GAP_REM = 0.25

/**
 * Places the sliding pill over the selected tab.
 *
 * Width is one grid column: the track's full width less its two paddings and
 * every gap, split evenly — the same arithmetic `auto-cols-fr` does for the
 * buttons. `translateX` can then move it in whole columns, because a
 * percentage translate resolves against the element's own width, and that
 * width is now exactly one column. The `+ gap` per step covers the space
 * between columns, which the width excludes.
 */
const indicatorStyle = computed(() => {
  const count = props.tabs.length || 1
  const gutters = TRACK_PADDING_REM * 2 + (count - 1) * TRACK_GAP_REM

  return {
    width: `calc((100% - ${gutters}rem) / ${count})`,
    transform: `translateX(calc(${selectedTab.value} * (100% + ${TRACK_GAP_REM}rem)))`,
  }
})

const handleTabChange = (index: number): void => {
  selectedTab.value = index
  emit('tab-change', index)
}

// Expose selected tab for parent access
defineExpose({
  selectedTab,
})
</script>
