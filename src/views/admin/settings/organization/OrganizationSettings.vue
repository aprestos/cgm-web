<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10 pb-16">
    <BasicInformation ref="basicInfoRef" />
    <BrandingSettings ref="brandingRef" />
  </div>
  <SettingsBottomBar :loading="isSaving" @save="handleSave" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BasicInformation from './BasicInformation.vue'
import BrandingSettings from './BrandingSettings.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'

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
