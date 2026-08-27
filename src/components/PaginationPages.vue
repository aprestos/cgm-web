<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/vue/20/solid'

interface Props {
  currentPage: number
  totalPages: number
  maxVisiblePages?: number
}

interface Emits {
  (e: 'page-change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 7,
})

const emit = defineEmits<Emits>()

const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisiblePages } = props
  const pages: (number | string)[] = []

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...')
    }

    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...')
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
  }

  return pages
})

const canGoPrevious = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const goToPrevious = () => {
  if (canGoPrevious.value) {
    goToPage(props.currentPage - 1)
  }
}

const goToNext = () => {
  if (canGoNext.value) {
    goToPage(props.currentPage + 1)
  }
}
</script>

<template>
  <nav
    class="mt-20 flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 dark:border-white/10"
  >
    <div class="-mt-px flex w-0 flex-1">
      <button
        :disabled="!canGoPrevious"
        :class="[
          'inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium',
          canGoPrevious
            ? 'text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200 cursor-pointer'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
        ]"
        @click="goToPrevious"
      >
        <ArrowLongLeftIcon
          :class="[
            'mr-3 size-5',
            canGoPrevious
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-300 dark:text-gray-600',
          ]"
          aria-hidden="true"
        />
        Previous
      </button>
    </div>

    <div class="hidden md:-mt-px md:flex">
      <template v-for="page in visiblePages" :key="page">
        <span
          v-if="page === '...'"
          class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
        >
          ...
        </span>
        <button
          v-else
          :class="[
            'inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium',
            page === currentPage
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200',
          ]"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goToPage(page as number)"
        >
          {{ page }}
        </button>
      </template>
    </div>

    <div class="-mt-px flex w-0 flex-1 justify-end">
      <button
        :disabled="!canGoNext"
        :class="[
          'inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium',
          canGoNext
            ? 'text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200 cursor-pointer'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
        ]"
        @click="goToNext"
      >
        Next
        <ArrowLongRightIcon
          :class="[
            'ml-3 size-5',
            canGoNext
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-300 dark:text-gray-600',
          ]"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
