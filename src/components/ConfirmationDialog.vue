<template>
  <DialogComponent :open="open" :title="title" @close="handleCancel">
    <div class="space-y-4">
      <div class="text-sm text-gray-600 dark:text-gray-300">
        <slot>
          <p>{{ message }}</p>
        </slot>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
        <CButton
          variant="secondary"
          size="lg"
          class="order-2 sm:order-1 w-full sm:w-auto"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </CButton>
        <CButton
          variant="primary"
          size="lg"
          class="order-1 sm:order-2 w-full sm:w-auto"
          :loading="loading"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </CButton>
      </div>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import DialogComponent from './DialogComponent.vue'
import CButton from './CButton.vue'

interface Props {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  confirmDisabled?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loading: false,
  confirmDisabled: false,
})

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const handleConfirm = (): void => {
  emit('confirm')
}

const handleCancel = (): void => {
  emit('close')
}
</script>
