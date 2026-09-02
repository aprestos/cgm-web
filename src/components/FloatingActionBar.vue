<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const bar = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

// The bar floats over the page, so the shell has to know how much room to leave
// below the content. Published as a custom property rather than a hard-coded
// padding so pages without a bar keep their full height — and so it collapses
// to 0 on its own when the bar is hidden by a breakpoint.
const publishClearance = (): void => {
  const el = bar.value
  const height = el?.offsetHeight ?? 0

  // Doubled so the gap the bar leaves above the content matches the one it
  // keeps below itself. Zero height means a breakpoint has hidden it, and then
  // there is nothing to reserve.
  const offset = el && height ? parseFloat(getComputedStyle(el).bottom) || 0 : 0

  document.documentElement.style.setProperty(
    '--floating-action-clearance',
    `${height + offset * 2}px`,
  )
}

onMounted(() => {
  publishClearance()

  if (bar.value) {
    observer = new ResizeObserver(publishClearance)
    observer.observe(bar.value)
  }

  // The offset resolves from the safe area, which changes on rotation without
  // the bar itself ever resizing.
  window.addEventListener('resize', publishClearance)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  window.removeEventListener('resize', publishClearance)
  // Back to the :root default, which is the safe area on its own.
  document.documentElement.style.removeProperty('--floating-action-clearance')
})
</script>

<template>
  <!-- Offset off the bottom edge rather than padded away from it: iOS Safari
       turns its translucent toolbar solid when page content is anchored to the
       bottom of the viewport, so the box must stop short of it rather than
       reach it and hold the gap as padding.

       pointer-events-none because the wrapper spans the viewport to centre the
       pill — only the pill should catch taps, the rest of the row belongs to
       the page scrolling underneath. -->
  <div
    ref="bar"
    class="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0.5rem)] z-40 flex justify-center px-4"
  >
    <div class="pointer-events-auto flex w-full items-center gap-2">
      <slot />
    </div>
  </div>
</template>
