<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// Computed titles that fall back to translations
const displayTitle = props.title || t('landing.gallery.title')
const displaySubtitle = props.subtitle || t('landing.gallery.subtitle')

// Shuffle images for variety
const displayImages = ref<string[]>([])

onMounted(() => {
  displayImages.value = [...props.images].sort(() => Math.random() - 0.5)
})
</script>

<template>
  <section
    v-if="displayImages.length > 0"
    :id="id || undefined"
    class="relative overflow-hidden bg-gray-100 dark:bg-gray-900"
  >
    <!-- Section Header (optional) -->
    <div v-if="displayTitle" class="relative z-10 pt-16 pb-8 text-center px-4">
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

    <!-- Marquee Gallery - Continuous Scroll -->
    <div class="relative py-8">
      <!-- First Row - Scrolls Left -->
      <div class="flex animate-marquee-left gap-4 mb-4">
        <div
          v-for="(image, index) in displayImages"
          :key="`row1-${index}`"
          class="relative shrink-0 h-56 w-80 sm:h-56 sm:w-80 md:h-64 md:w-96 overflow-hidden rounded-2xl"
        >
          <img
            :src="image"
            :alt="`Convention moment ${index + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <!-- Duplicate for seamless loop -->
        <div
          v-for="(image, index) in displayImages"
          :key="`row1-dup-${index}`"
          class="relative shrink-0 h-56 w-80 sm:h-56 sm:w-80 md:h-64 md:w-96 overflow-hidden rounded-2xl"
        >
          <img
            :src="image"
            :alt="`Convention moment ${index + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      <!-- Second Row - Scrolls Right (reversed) -->
      <div
        v-if="displayImages.length > 3"
        class="flex animate-marquee-right gap-4"
      >
        <div
          v-for="(image, index) in [...displayImages].reverse()"
          :key="`row2-${index}`"
          class="relative shrink-0 h-56 w-80 sm:h-56 sm:w-80 md:h-64 md:w-96 overflow-hidden rounded-2xl"
        >
          <img
            :src="image"
            :alt="`Convention moment ${index + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <!-- Duplicate for seamless loop -->
        <div
          v-for="(image, index) in [...displayImages].reverse()"
          :key="`row2-dup-${index}`"
          class="relative shrink-0 h-56 w-80 sm:h-56 sm:w-80 md:h-64 md:w-96 overflow-hidden rounded-2xl"
        >
          <img
            :src="image"
            :alt="`Convention moment ${index + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>

    <!-- Fade edges -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 md:w-24 bg-linear-to-r from-gray-100 dark:from-gray-900 to-transparent z-10"
    />
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 md:w-24 bg-linear-to-l from-gray-100 dark:from-gray-900 to-transparent z-10"
    />
  </section>
</template>

<style scoped>
@keyframes marquee-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes marquee-right {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-marquee-left {
  animation: marquee-left 40s linear infinite;
}

.animate-marquee-right {
  animation: marquee-right 45s linear infinite;
}

/* Pause animation on hover */
.animate-marquee-left:hover,
.animate-marquee-right:hover {
  animation-play-state: paused;
}
</style>
