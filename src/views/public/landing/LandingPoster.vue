<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { IconX, IconZoomIn } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  posterUrl: string
  editionName?: string
}

const props = withDefaults(defineProps<Props>(), {
  editionName: '',
})

const showLightbox = ref<boolean>(false)

function openLightbox(): void {
  showLightbox.value = true
}

function closeLightbox(): void {
  showLightbox.value = false
}

const altText = props.editionName
  ? t('landing.poster.altText', { name: props.editionName })
  : t('landing.poster.eventPoster')
</script>

<template>
  <!-- Poster Thumbnail Card -->
  <div class="group relative">
    <button
      type="button"
      class="poster-card relative block cursor-pointer overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:shadow-indigo-500/20 hover:ring-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
      :aria-label="t('landing.poster.viewPoster')"
      @click="openLightbox"
    >
      <!-- Poster Image -->
      <span class="block aspect-3/4 w-full overflow-hidden">
        <img
          :src="posterUrl"
          :alt="altText"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="eager"
        />
      </span>

      <!-- Shimmer Overlay -->
      <span
        class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <span class="shimmer-sweep absolute inset-0" />
      </span>

      <!-- Hover Zoom Icon -->
      <span
        class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30"
      >
        <span
          class="flex h-14 w-14 items-center justify-center rounded-full bg-white/0 backdrop-blur-none transition-all duration-300 group-hover:bg-white/20 group-hover:backdrop-blur-sm scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
        >
          <IconZoomIn class="h-7 w-7 text-white drop-shadow-lg" />
        </span>
      </span>

      <!-- Bottom Gradient -->
      <span
        class="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/40 to-transparent"
      />
    </button>

    <!-- Decorative glow behind card -->
    <div
      class="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-linear-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100 dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-fuchsia-500/15"
    />
  </div>

  <!-- Lightbox Dialog -->
  <TransitionRoot :show="showLightbox" as="template">
    <Dialog class="relative z-100" @close="closeLightbox">
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
          class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity dark:bg-black/90"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 sm:p-8">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-90"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-90"
          >
            <DialogPanel class="relative max-h-[90vh] max-w-3xl">
              <!-- Close Button -->
              <button
                type="button"
                class="absolute -right-3 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 sm:-right-4 sm:-top-4"
                :aria-label="t('common.close')"
                @click="closeLightbox"
              >
                <IconX class="h-5 w-5" />
              </button>

              <!-- Full-Size Poster -->
              <img
                :src="posterUrl"
                :alt="altText"
                class="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%) rotate(15deg);
  }
  100% {
    transform: translateX(200%) rotate(15deg);
  }
}

.shimmer-sweep {
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.15) 55%,
    transparent 70%
  );
  animation: shimmer-sweep 2.5s ease-in-out infinite;
}

.poster-card {
  transform: perspective(800px) rotateY(-3deg);
  transition:
    transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.5s ease;
}

.poster-card:hover {
  transform: perspective(800px) rotateY(0deg) translateY(-4px);
}
</style>
