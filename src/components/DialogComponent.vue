<template>
  <div>
    <TransitionRoot as="template" :show="props.open">
      <Dialog class="relative z-[100]" @close="closeDialog">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-black/70 dark:bg-gray-900/80 transition-opacity backdrop-blur-sm"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div
            class="flex min-h-full justify-center text-center items-end sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                :class="[
                  'relative transform overflow-y-auto max-h-full w-full sm:h-auto sm:w-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 text-left shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all sm:my-8 sm:overflow-visible',
                  dialogSizeClasses,
                ]"
              >
                <div
                  class="border-b border-gray-100 dark:border-white/10 px-4 pt-5 pb-4 sm:px-6"
                >
                  <div class="flex items-start justify-between gap-4">
                    <h3
                      v-if="title"
                      class="font-display text-xl font-bold text-gray-900 dark:text-white"
                    >
                      {{ title }}
                    </h3>
                    <button
                      type="button"
                      class="ml-auto cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      @click="closeDialog"
                    >
                      <span class="sr-only">Close</span>
                      <IconX class="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <slot name="header-sub-content"></slot>
                </div>

                <div class="px-4 py-5 sm:p-6">
                  <slot />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { IconX } from '@tabler/icons-vue'
import { computed } from 'vue'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

interface Props {
  open: boolean
  title?: string
  size?: DialogSize
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
})

const emit = defineEmits<{
  close: []
}>()

const closeDialog = (): void => {
  emit('close')
}

const dialogSizeClasses = computed((): string => {
  const sizeMap: Record<DialogSize, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg md:min-w-[500px]',
    lg: 'sm:max-w-2xl md:min-w-[700px]',
    xl: 'sm:max-w-4xl md:min-w-[900px]',
    '2xl': 'sm:max-w-6xl md:min-w-[1100px]',
    full: 'sm:max-w-[90vw] md:min-w-[80vw]',
  }
  return sizeMap[props.size]
})
</script>
