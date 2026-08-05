<template>
  <BaseCard no-padding class="overflow-hidden">
    <!-- Loading skeleton -->
    <div v-if="loading">
      <!-- Tab bar skeleton (below lg) -->
      <div
        class="flex animate-pulse gap-2 border-b border-gray-100 px-4 py-3 dark:border-white/5 lg:hidden"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700"
        />
      </div>
      <div class="lg:grid lg:grid-cols-[380px_1fr]">
        <!-- List skeleton (lg and up) -->
        <div
          class="hidden divide-y divide-gray-100 border-r border-gray-100 dark:divide-white/5 dark:border-white/5 lg:block"
        >
          <div v-for="i in 5" :key="i" class="animate-pulse px-4 py-4">
            <div class="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="mt-2 h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <!-- Detail skeleton -->
        <div class="animate-pulse p-4">
          <div class="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="mt-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="mt-6 grid grid-cols-2 gap-4">
            <div
              v-for="i in 4"
              :key="i"
              class="h-10 rounded bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="p-4">
      <slot name="list-empty" />
    </div>

    <template v-else>
      <!-- Tabs (below lg) -->
      <div
        class="overflow-x-auto border-b border-gray-100 dark:border-white/5 lg:hidden"
      >
        <nav class="flex min-w-max px-2">
          <button
            v-for="(item, index) in items"
            :key="getKey(item, index)"
            type="button"
            class="whitespace-nowrap border-b-2 px-3 py-2.5 text-left text-sm font-medium transition-colors"
            :class="
              isSelected(item, index)
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
            :aria-pressed="isSelected(item, index)"
            @click="emit('select', item)"
          >
            <slot name="tab" :item="item" :selected="isSelected(item, index)">
              {{ getKey(item, index) }}
            </slot>
          </button>
        </nav>
      </div>

      <div class="lg:grid lg:grid-cols-[380px_1fr]">
        <!-- List (lg and up) -->
        <div
          class="hidden border-r border-gray-100 dark:border-white/5 lg:block"
        >
          <div
            v-if="$slots['list-header']"
            class="border-b border-gray-100 px-4 py-3 dark:border-white/5"
          >
            <slot name="list-header" />
          </div>
          <ul
            class="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto dark:divide-white/5"
          >
            <li v-for="(item, index) in items" :key="getKey(item, index)">
              <button
                type="button"
                class="group flex w-full cursor-pointer items-center gap-2 border-l-2 pr-3 text-left transition-colors"
                :class="
                  isSelected(item, index)
                    ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-500/10'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                "
                :aria-pressed="isSelected(item, index)"
                @click="emit('select', item)"
              >
                <div class="min-w-0 flex-1">
                  <slot
                    name="row"
                    :item="item"
                    :selected="isSelected(item, index)"
                  />
                </div>
                <IconChevronRight
                  class="h-4 w-4 shrink-0 transition-colors"
                  :class="
                    isSelected(item, index)
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400'
                  "
                />
              </button>
            </li>
          </ul>
        </div>

        <!-- Detail -->
        <div class="p-4">
          <slot name="detail" />
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts" generic="T">
import type { PropType } from 'vue'
import { IconChevronRight } from '@tabler/icons-vue'
import BaseCard from '@/components/BaseCard.vue'

const props = defineProps({
  items: {
    type: Array as PropType<T[]>,
    required: true,
  },
  selectedId: {
    type: [String, Number, null] as PropType<string | number | null>,
    default: null,
  },
  rowKey: {
    type: [String, Function] as PropType<
      string | ((item: T) => string | number)
    >,
    default: 'id',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  select: [item: T]
}>()

const getKey = (item: T, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item)
  }
  return (
    ((item as Record<string, unknown>)[props.rowKey] as
      string | number | undefined) ?? index
  )
}

const isSelected = (item: T, index: number): boolean =>
  props.selectedId !== null && getKey(item, index) === props.selectedId
</script>
