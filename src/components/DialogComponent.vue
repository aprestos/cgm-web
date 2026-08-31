<template>
  <div>
    <TransitionRoot as="template" :show="props.open">
      <Dialog class="relative z-100" @close="closeDialog">
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
                <!-- Chrome-less: the content supplies its own header, so all
                     that is left to place is the way out of the dialog. -->
                <button
                  v-if="hideHeader"
                  type="button"
                  class="absolute right-4 top-4 z-20 grid size-9 cursor-pointer place-items-center rounded-lg bg-white/85 text-gray-700 ring-1 ring-black/10 backdrop-blur transition-colors hover:bg-white dark:bg-gray-900/80 dark:text-gray-200 dark:ring-white/15 sm:right-5 sm:top-5"
                  @click="closeDialog"
                >
                  <span class="sr-only">Close</span>
                  <IconX class="h-5 w-5" aria-hidden="true" />
                </button>

                <div
                  v-if="!hideHeader"
                  class="px-4 pt-5 pb-4 sm:px-6"
                  :class="
                    cover
                      ? 'relative flex min-h-44 flex-col justify-end overflow-hidden rounded-t-2xl sm:min-h-52'
                      : 'border-b border-gray-100 dark:border-white/10'
                  "
                >
                  <!-- Cover art sits behind the header rather than above it, so
                       the title and close button read as part of the image -->
                  <template v-if="cover">
                    <img
                      :src="cover"
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      class="absolute inset-0 size-full object-cover"
                    />
                    <!-- Photos are unpredictable; the scrim is what guarantees
                         the white text on top of one stays legible -->
                    <div
                      class="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/25"
                    />
                  </template>

                  <!-- Badges ride on the cover art, clear of the close
                       button. Without cover art there is nothing to ride on,
                       so they sit inline above the title instead. -->
                  <div
                    v-if="$slots['header-badges']"
                    :class="
                      cover
                        ? 'pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 pr-16 sm:left-6 sm:top-5'
                        : 'mb-2 flex flex-wrap items-center gap-2'
                    "
                  >
                    <slot name="header-badges" />
                  </div>

                  <!-- z-10 with no positioning: as a flex item it stacks above
                       the image, and the close button below can then anchor to
                       the header itself rather than to this row -->
                  <div
                    class="flex items-start justify-between gap-4"
                    :class="cover ? 'z-10' : ''"
                  >
                    <h3
                      v-if="title"
                      class="font-display text-xl font-bold"
                      :class="
                        cover
                          ? 'text-white drop-shadow-sm'
                          : 'text-gray-900 dark:text-white'
                      "
                    >
                      {{ title }}
                    </h3>
                    <button
                      type="button"
                      class="cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors"
                      :class="
                        cover
                          ? 'absolute right-4 top-4 z-10 bg-black/40 text-white backdrop-blur hover:bg-black/60 sm:right-6 sm:top-5'
                          : 'ml-auto text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'
                      "
                      @click="closeDialog"
                    >
                      <span class="sr-only">Close</span>
                      <IconX class="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div :class="cover ? 'z-10' : 'contents'">
                    <slot name="header-sub-content"></slot>
                  </div>
                </div>

                <div :class="bodyClass">
                  <slot />
                </div>

                <!-- Actions that belong to the dialog rather than to its
                     content. Absent by default, so dialogs that put their own
                     buttons in the body are untouched. -->
                <div
                  v-if="$slots.footer"
                  class="border-t border-gray-100 px-4 py-4 sm:px-6 dark:border-white/10"
                >
                  <slot name="footer" />
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
  /** Artwork for the header background. Without it the header stays plain. */
  cover?: string
  /**
   * Padding of the body. Overridable so a dialog can run its content to the
   * panel edges (a split layout, a full-bleed list) and pad the parts itself.
   */
  bodyClass?: string
  /**
   * Drops the header strip for content that renders its own. The close button
   * stays, floating over the top-right of the panel.
   */
  hideHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
  cover: undefined,
  bodyClass: 'px-4 py-5 sm:p-6',
  hideHeader: false,
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
    // Clamped to the viewport: a bare min-width wider than the screen (a
    // tablet in portrait, a half-width browser window) pushes the panel out
    // of the backdrop and takes the close button with it.
    xl: 'sm:max-w-4xl md:min-w-[min(900px,calc(100vw-4rem))]',
    '2xl': 'sm:max-w-6xl md:min-w-[min(1100px,calc(100vw-4rem))]',
    full: 'sm:max-w-[90vw] md:min-w-[80vw]',
  }
  return sizeMap[props.size]
})
</script>
