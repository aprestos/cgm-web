<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  images: string[]
  title?: string
  subtitle?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  id: '',
})

const displayTitle = computed<string>(
  () => props.title || t('landing.gallery.title'),
)
const displaySubtitle = computed<string>(
  () => props.subtitle || t('landing.gallery.subtitle'),
)

const displayImages = ref<string[]>([])
const imageElements = ref<Array<HTMLElement | null>>([])
const visibleImagesMap = ref<Record<number, boolean>>({})

let imageObserver: IntersectionObserver | null = null

function shuffleImages(images: string[]): string[] {
  return [...images].sort(() => Math.random() - 0.5)
}

function getImageCardClass(index: number): string {
  const pattern: string[] = [
    'row-span-2 sm:row-span-2 lg:row-span-3',
    'row-span-1 sm:row-span-2',
    'col-span-2 row-span-1 sm:col-span-1 lg:col-span-2 lg:row-span-2',
    'row-span-2 lg:row-span-2',
    'row-span-1 sm:row-span-2',
    'col-span-2 row-span-2 sm:col-span-1 lg:col-span-2 lg:row-span-1',
    'row-span-2 sm:row-span-2',
    'row-span-1',
  ]

  return pattern[index % pattern.length] ?? 'row-span-1'
}

function setImageElement(
  element: Element | ComponentPublicInstance | null,
  index: number,
): void {
  imageElements.value[index] = element instanceof HTMLElement ? element : null
}

function setupImageObserver(): void {
  imageObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue
        }

        const indexValue = Number(entry.target.getAttribute('data-index'))
        if (Number.isNaN(indexValue)) {
          continue
        }

        visibleImagesMap.value = {
          ...visibleImagesMap.value,
          [indexValue]: true,
        }

        imageObserver?.unobserve(entry.target)
      }
    },
    {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15,
    },
  )

  for (const element of imageElements.value) {
    if (element) {
      imageObserver.observe(element)
    }
  }
}

onMounted(() => {
  displayImages.value = shuffleImages(props.images)

  void nextTick(() => {
    setupImageObserver()
  })
})

onBeforeUnmount(() => {
  imageObserver?.disconnect()
})
</script>

<template>
  <section
    v-if="displayImages.length > 0"
    :id="id || undefined"
    class="relative overflow-hidden bg-gray-50 dark:bg-gray-950"
  >
    <!-- Section Header (optional) -->
    <div class="relative z-10 pt-16 pb-8 text-center px-4">
      <h2
        class="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
      >
        {{ displaySubtitle }}
      </h2>
      <p
        class="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
      >
        {{ displayTitle }}
      </p>
    </div>

    <div class="relative py-8 px-4 sm:px-6 lg:px-8">
      <div
        class="mx-auto grid max-w-7xl auto-rows-[90px] grid-cols-2 gap-3 sm:auto-rows-[120px] sm:grid-cols-3 sm:gap-5 lg:auto-rows-[150px] lg:grid-cols-5 lg:gap-6"
      >
        <div
          v-for="(image, index) in displayImages"
          :key="`gallery-${index}`"
          :ref="(element) => setImageElement(element, index)"
          :data-index="index"
          :data-visible="visibleImagesMap[index] ? 'true' : 'false'"
          :class="[
            'gallery-image group relative overflow-hidden rounded-2xl',
            getImageCardClass(index),
          ]"
          :style="{ transitionDelay: `${Math.min(index * 80, 500)}ms` }"
        >
          <img
            :src="image"
            :alt="`Convention moment ${index + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gallery-image {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.gallery-image[data-visible='true'] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .gallery-image {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
