<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
    <BasicInformation ref="basicInfoRef" />
    <BrandingSettings ref="brandingRef" />
    <UserRoles />
  </div>

  <FloatingActionBar class="lg:pl-72">
    <CButton
      size="lg"
      type="button"
      rounded
      :loading="isSaving"
      loading-text="Saving..."
      @click="handleSave"
    >
      <template #icon-left>
        <IconDeviceFloppy class="h-4 w-4" aria-hidden="true" />
      </template>
      Save
    </CButton>
  </FloatingActionBar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BasicInformation from './BasicInformation.vue'
import BrandingSettings from './BrandingSettings.vue'
import UserRoles from './UserRoles.vue'
import CButton from '@/components/CButton.vue'
import FloatingActionBar from '@/components/FloatingActionBar.vue'
import { IconDeviceFloppy } from '@tabler/icons-vue'

const basicInfoRef = ref<InstanceType<typeof BasicInformation> | null>(null)
const brandingRef = ref<InstanceType<typeof BrandingSettings> | null>(null)

const isSaving = computed(
  () =>
    (basicInfoRef.value?.isSaving ?? false) ||
    (brandingRef.value?.isSaving ?? false),
)

const handleSave = async (): Promise<void> => {
  await Promise.all([basicInfoRef.value?.save(), brandingRef.value?.save()])
}
</script>
