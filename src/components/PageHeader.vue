<script setup lang="ts">
import CButton from '@/components/CButton.vue'
import FloatingActionBar from '@/components/FloatingActionBar.vue'

interface Props {
  title: string
  description?: string
  /** When set, renders the primary page action (inline on lg+, floating bar below). */
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  actionLabel: '',
})

defineEmits<{
  action: []
}>()

// Multiple roots: the floating bar must stay outside the lg-only header row.
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div v-bind="$attrs" class="hidden lg:flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold font-display text-gray-900 dark:text-white">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-1 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ description }}
      </p>
    </div>

    <CButton v-if="actionLabel" size="lg" @click="$emit('action')">
      <template #icon-left>
        <slot name="action-icon" />
      </template>
      {{ actionLabel }}
    </CButton>
  </div>

  <FloatingActionBar v-if="actionLabel" class="lg:hidden">
    <CButton size="xl" class="w-full" rounded @click="$emit('action')">
      <template #icon-left>
        <slot name="action-icon" />
      </template>
      {{ actionLabel }}
    </CButton>
  </FloatingActionBar>
</template>
