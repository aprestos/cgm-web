<template>
  <div
    class="relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Feature Icon and Title -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30"
        >
          <component
            :is="icon"
            class="h-6 w-6 text-indigo-600 dark:text-indigo-400"
          />
        </div>
        <div>
          <div class="flex justify-between items-center gap-2">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <!-- Status Badge -->
            <span
              v-if="status"
              :class="[
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                statusClasses,
              ]"
            >
              <component
                :is="statusIcon"
                v-if="statusIcon"
                class="mr-1 h-3 w-3"
                aria-hidden="true"
              />
              {{ statusLabel }}
            </span>
          </div>

          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Toggle and Configure Section -->
    <div class="mt-6 flex items-center justify-between">
      <!-- Toggle Switch -->
      <div class="flex items-center gap-3">
        <div
          class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500"
        >
          <span
            class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
          />
          <input
            :id="`feature-${slug}`"
            :checked="modelValue"
            type="checkbox"
            :name="`feature-${slug}`"
            class="absolute inset-0 appearance-none focus:outline-hidden"
            :aria-labelledby="`feature-${slug}-label`"
            @change="
              $emit(
                'update:modelValue',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
        </div>
        <label
          :id="`feature-${slug}-label`"
          :for="`feature-${slug}`"
          class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
        >
          {{ modelValue ? 'Enabled' : 'Disabled' }}
        </label>
      </div>

      <!-- Configure Button -->
      <button
        v-if="configurable && modelValue"
        type="button"
        class="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        @click="$emit('configure')"
      >
        Configure →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { IconCheck, IconAlertCircle } from '@tabler/icons-vue'

interface Props {
  title: string
  description: string
  slug: string
  icon: Component
  modelValue: boolean | undefined
  status?: 'complete' | 'warning' | 'error' | null
  configurable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'configure'): void
}

const props = withDefaults(defineProps<Props>(), {
  status: null,
  configurable: false,
})

defineEmits<Emits>()

const statusClasses = computed((): string => {
  switch (props.status) {
    case 'complete':
      return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20'
    case 'warning':
      return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20'
    case 'error':
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
    default:
      return ''
  }
})

const statusIcon = computed((): Component | null => {
  switch (props.status) {
    case 'complete':
      return IconCheck
    case 'warning':
    case 'error':
      return IconAlertCircle
    default:
      return null
  }
})

const statusLabel = computed((): string => {
  switch (props.status) {
    case 'complete':
      return 'Configured'
    case 'warning':
      return 'Needs Setup'
    case 'error':
      return 'Error'
    default:
      return ''
  }
})
</script>
