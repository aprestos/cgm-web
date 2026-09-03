<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useMinWidth, type Breakpoint } from '@/composables/useBreakpoint.ts'

interface Props {
  open: boolean
  title?: string
  // Which edge the panel slides in from.
  side?: 'left' | 'right'
  // From this breakpoint up the content sits in the page as a column instead
  // of behind a button. Leave unset to keep the slide-over at every width.
  pinnedFrom?: Extract<Breakpoint, 'md' | 'lg'>
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  side: 'right',
  pinnedFrom: undefined,
})

// The pinned column renders where the component sits in the page, so it needs
// its own classes rather than the ones meant for the slide-over.
defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

// The panel is parked off its own edge, so the transition mirrors the side.
const offscreen = computed<string>(() =>
  props.side === 'right' ? 'translate-x-full' : '-translate-x-full',
)

// Matched in JavaScript rather than hidden with CSS so only one copy of the
// controls is ever in the DOM: two would mean duplicate input ids and two
// elements answering to the same label. The width comes from the Tailwind
// theme, so this switches over exactly where a `md:` utility would.
const pinned = useMinWidth(props.pinnedFrom)

const close = (): void => emit('update:open', false)
</script>

<template>
  <!-- Pinned: the same controls, straight in the page. No overlay, no header
       chrome — the content is already visible, so it needs no announcing. -->
  <aside v-if="pinned" v-bind="$attrs">
    <h2 class="sr-only">{{ title }}</h2>
    <slot />
    <div v-if="$slots.footer" class="pt-4">
      <slot name="footer" />
    </div>
  </aside>

  <!-- A slide-over that holds whatever controls a page puts in it: the panel
       owns the overlay, the header and the scrolling, the page owns the
       content. -->
  <TransitionRoot v-else as="template" :show="open">
    <Dialog class="relative z-40" @close="close">
      <TransitionChild
        as="template"
        enter="transition-opacity ease-linear duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25" />
      </TransitionChild>

      <div class="fixed inset-0 z-40 flex">
        <TransitionChild
          as="template"
          enter="transform transition ease-in-out duration-300"
          :enter-from="offscreen"
          enter-to="translate-x-0"
          leave="transform transition ease-in-out duration-300"
          leave-from="translate-x-0"
          :leave-to="offscreen"
        >
          <DialogPanel
            class="relative flex size-full max-w-xs flex-col bg-white shadow-xl dark:bg-gray-800"
            :class="side === 'right' ? 'ml-auto' : 'mr-auto'"
          >
            <div
              class="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-700"
            >
              <slot name="header">
                <DialogTitle
                  class="text-lg font-medium text-gray-900 dark:text-white"
                >
                  {{ title }}
                </DialogTitle>
              </slot>

              <button
                type="button"
                class="relative -mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="close"
              >
                <span class="sr-only">{{ t('common.actions.close') }}</span>
                <XMarkIcon class="size-6" aria-hidden="true" />
              </button>
            </div>

            <!-- Only the content scrolls, so the header and footer stay put -->
            <div class="flex-1 overflow-y-auto">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="border-t border-gray-200 p-4 dark:border-gray-700"
            >
              <slot name="footer" />
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped></style>
