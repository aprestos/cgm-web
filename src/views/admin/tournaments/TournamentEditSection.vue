<script setup lang="ts">
/**
 * One block of the details layout that can be edited where it sits. The
 * display and the fields swap in the same place, so nothing moves between
 * reading a tournament and changing it.
 */
import { useI18n } from 'vue-i18n'
import { IconPencil } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'

interface Props {
  title: string
  editing: boolean
  saving?: boolean
}

withDefaults(defineProps<Props>(), { saving: false })

const emit = defineEmits<{
  'update:editing': [value: boolean]
  /** Fired before the fields appear, so the parent can seed the draft. */
  edit: []
  cancel: []
  save: []
}>()

const { t } = useI18n()

const startEditing = (): void => {
  emit('edit')
  emit('update:editing', true)
}

const cancel = (): void => {
  emit('cancel')
  emit('update:editing', false)
}
</script>

<template>
  <section
    class="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0 dark:border-white/10"
  >
    <div class="flex items-center justify-between gap-3">
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        {{ title }}
      </h4>
      <button
        v-if="!editing"
        type="button"
        class="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        @click="startEditing"
      >
        <IconPencil class="size-3.5" aria-hidden="true" />
        {{ t('common.actions.edit') }}
      </button>
    </div>

    <div class="mt-3">
      <slot v-if="editing" name="edit" />
      <slot v-else name="display" />
    </div>

    <div v-if="editing" class="mt-4 flex justify-end gap-2">
      <CButton variant="secondary" size="sm" :disabled="saving" @click="cancel">
        {{ t('common.actions.cancel') }}
      </CButton>
      <CButton
        variant="primary"
        size="sm"
        :loading="saving"
        :loading-text="t('common.actions.updating')"
        @click="emit('save')"
      >
        {{ t('common.actions.save') }}
      </CButton>
    </div>
  </section>
</template>
