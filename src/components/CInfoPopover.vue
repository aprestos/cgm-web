<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  onClickOutside,
  useElementBounding,
  useEventListener,
  useWindowSize,
} from '@vueuse/core'
import { IconInfoCircle } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'

/**
 * A short explanation anchored to the button that asked for it — for the cases
 * where a click has nothing to do yet and the user is owed a sentence about why.
 * That is the default: with no `title`/`message` it says the one shared
 * `common.comingSoon` wording, so no screen invents its own phrasing for it.
 *
 * The panel is teleported and positioned against the viewport, so it survives
 * dialogs, scroll containers and triggers that unmount (a menu item that closes
 * its menu on click). Such a trigger passes itself as `anchor` and drives
 * `v-model:open`; everything else just wraps its button content in the default
 * slot and lets the component own the state.
 */
defineOptions({ inheritAttrs: false })

interface Props {
  /** The sentence the popover exists to say. Defaults to `common.comingSoon`. */
  message?: string
  title?: string
  /** A second, quieter line under the message. */
  description?: string
  /** Anchors the panel to a button this component does not render itself. */
  anchor?: HTMLElement | null
  placement?: 'bottom' | 'top'
  align?: 'start' | 'center' | 'end'
}

const props = withDefaults(defineProps<Props>(), {
  message: undefined,
  title: undefined,
  description: undefined,
  anchor: undefined,
  placement: 'bottom',
  align: 'end',
})

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const title = computed<string>(
  () => props.title ?? t('common.comingSoon.title'),
)
const message = computed<string>(
  () => props.message ?? t('common.comingSoon.message'),
)

/** Matches the `w-72` the panel is designed around. */
const PANEL_WIDTH = 288
/** Breathing room from the trigger and from the viewport edges. */
const GAP = 8
/** Stands in for the panel height until it has rendered and can be measured. */
const ESTIMATED_HEIGHT = 120

const triggerEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

const anchorEl = computed<HTMLElement | null>(
  () => props.anchor ?? triggerEl.value,
)

const anchorBounds = useElementBounding(anchorEl)
const panelBounds = useElementBounding(panelEl)
const { width: viewportWidth, height: viewportHeight } = useWindowSize()

// Rows near the bottom of a long list would otherwise open the panel off-screen.
const placement = computed<'bottom' | 'top'>(() => {
  const height = panelBounds.height.value || ESTIMATED_HEIGHT

  if (props.placement === 'bottom') {
    const overflowsBelow =
      anchorBounds.bottom.value + GAP + height > viewportHeight.value
    const fitsAbove = anchorBounds.top.value - GAP - height > 0
    return overflowsBelow && fitsAbove ? 'top' : 'bottom'
  }

  return anchorBounds.top.value - GAP - height < 0 ? 'bottom' : 'top'
})

const panelStyle = computed(() => {
  const width = Math.min(PANEL_WIDTH, viewportWidth.value - GAP * 2)

  const aligned = {
    start: anchorBounds.left.value,
    center: anchorBounds.left.value + anchorBounds.width.value / 2 - width / 2,
    end: anchorBounds.right.value - width,
  }[props.align]

  const left = Math.min(
    Math.max(aligned, GAP),
    viewportWidth.value - width - GAP,
  )

  if (placement.value === 'top') {
    return {
      width: `${width}px`,
      left: `${left}px`,
      top: `${anchorBounds.top.value - GAP}px`,
      transform: 'translateY(-100%)',
    }
  }

  return {
    width: `${width}px`,
    left: `${left}px`,
    top: `${anchorBounds.bottom.value + GAP}px`,
  }
})

function close(): void {
  open.value = false
}

onClickOutside(panelEl, close, { ignore: [triggerEl, anchorEl] })

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (open.value && event.key === 'Escape') close()
})

// A nested scroll container moves the trigger without moving the window, so the
// panel follows it rather than hanging where the button used to be.
useEventListener(
  window,
  'scroll',
  () => {
    if (!open.value) return
    anchorBounds.update()
    panelBounds.update()
  },
  { capture: true, passive: true },
)

watch(open, async (isOpen) => {
  if (!isOpen) return

  anchorBounds.update()
  await nextTick()
  // The measured height decides whether the panel flips above the trigger.
  panelBounds.update()
  panelEl.value?.focus()
})
</script>

<template>
  <button
    v-if="!anchor"
    ref="triggerEl"
    type="button"
    v-bind="$attrs"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = !open"
  >
    <slot />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        ref="panelEl"
        role="dialog"
        tabindex="-1"
        :aria-label="title"
        :style="panelStyle"
        class="fixed z-[110] rounded-xl bg-white p-4 text-left shadow-xl outline-1 outline-black/5 focus:outline-hidden dark:bg-gray-800 dark:outline-white/10"
      >
        <div class="flex gap-3">
          <IconInfoCircle
            class="mt-0.5 size-5 shrink-0 text-primary-500"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </p>
            <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {{ message }}
            </p>
            <p
              v-if="description"
              class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ description }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped></style>
