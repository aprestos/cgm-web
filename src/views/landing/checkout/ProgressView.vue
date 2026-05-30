<template>
  <div>
    <h4 class="sr-only">Progress</h4>

    <div
      class="overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
      aria-hidden="true"
    >
      <div
        class="h-2 rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>

    <ol class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :class="[
          'rounded-xl border px-3 py-2 text-sm transition-colors',
          step.status === 'current'
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/10 dark:text-indigo-300'
            : step.status === 'completed'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-gray-200 bg-white text-gray-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-400',
        ]"
      >
        <div class="flex items-center gap-2">
          <span
            :class="[
              'inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold',
              step.status === 'completed'
                ? 'bg-emerald-500 text-white'
                : step.status === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300',
            ]"
          >
            {{ index + 1 }}
          </span>
          <span class="truncate">{{ step.name }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ProgressStep {
  id: string
  name: string
  status: 'completed' | 'current' | 'upcoming'
}

interface Props {
  steps: ProgressStep[]
}

const props = defineProps<Props>()

const progressPercentage = computed((): number => {
  if (props.steps.length <= 1) {
    return 0
  }

  const currentIndex = props.steps.findIndex(
    (step) => step.status === 'current',
  )
  if (currentIndex === -1) {
    const completedCount = props.steps.filter(
      (step) => step.status === 'completed',
    ).length
    return Math.round((completedCount / (props.steps.length - 1)) * 100)
  }

  return Math.round((currentIndex / (props.steps.length - 1)) * 100)
})
</script>
