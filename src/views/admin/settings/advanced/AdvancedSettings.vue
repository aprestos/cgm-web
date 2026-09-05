<template>
  <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
    <PlatformSettings ref="platformRef" />
    <IntegrationsSettings />
    <DomainsSettings />
    <DataManagement />
  </div>

  <FloatingActionBar class="lg:pl-72">
    <CButton
      size="lg"
      type="button"
      rounded
      :loading="platformRef?.isSaving ?? false"
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
import { ref } from 'vue'
import PlatformSettings from './PlatformSettings.vue'
import IntegrationsSettings from './IntegrationsSettings.vue'
import DomainsSettings from './DomainsSettings.vue'
import DataManagement from './DataManagement.vue'
import CButton from '@/components/CButton.vue'
import FloatingActionBar from '@/components/FloatingActionBar.vue'
import { IconDeviceFloppy } from '@tabler/icons-vue'

const platformRef = ref<InstanceType<typeof PlatformSettings> | null>(null)

const handleSave = async (): Promise<void> => {
  await platformRef.value?.save()
}
</script>
