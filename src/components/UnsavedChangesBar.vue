<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-1"
  >
    <div
      v-if="hasUnsavedChanges"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <IconAlertCircle
              class="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                You have unsaved changes
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Make sure to save your changes before leaving this page
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              @click="$emit('discard')"
            >
              Discard
            </button>
            <CButton type="button" @click="$emit('save')">
              Save Changes
            </CButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import CButton from '@/components/CButton.vue'
import { IconAlertCircle } from '@tabler/icons-vue'

interface Props {
  hasUnsavedChanges: boolean
}

interface Emits {
  (e: 'save'): void
  (e: 'discard'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
