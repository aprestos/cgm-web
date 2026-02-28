<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10 pb-16">
    <PlatformSettings ref="platformRef" />
    <IntegrationsSettings />
    <DataManagement />
  </div>
  <SettingsBottomBar
    :loading="platformRef?.isSaving ?? false"
    @save="handleSave"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PlatformSettings from './PlatformSettings.vue'
import IntegrationsSettings from './IntegrationsSettings.vue'
import DataManagement from './DataManagement.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'

const platformRef = ref<InstanceType<typeof PlatformSettings> | null>(null)

const handleSave = async (): Promise<void> => {
  await platformRef.value?.save()
}
</script>
