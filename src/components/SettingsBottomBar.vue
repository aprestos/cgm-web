<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
    <!-- Fade gradient -->
    <div
      class="absolute inset-0 bg-linear-to-t from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent"
    />
    <!-- Button row -->
    <div
      class="relative pointer-events-auto px-4 pb-6 pt-8 sm:px-6 lg:px-8 flex justify-end"
    >
      <CButton
        size="lg"
        type="button"
        :loading="loading"
        loading-text="Saving..."
        class="shadow-lg shadow-black/10 dark:shadow-black/30 ring-1 ring-black/5 dark:ring-white/10"
        @click="$emit('save')"
      >
        <template #icon-left>
          <IconDeviceFloppy class="h-4 w-4" aria-hidden="true" />
        </template>
        Save
      </CButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconDeviceFloppy } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'

interface Props {
  loading?: boolean
}

interface Emits {
  (e: 'save'): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<Emits>()
</script>
