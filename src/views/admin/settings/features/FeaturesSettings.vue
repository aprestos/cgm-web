<template>
  <div class="py-6">
    <div class="px-4 sm:px-6 lg:px-8 pb-16">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Features
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enable or disable features for your convention platform. Configure
          each feature by clicking the "Configure" button when enabled.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <!-- Library Feature -->
        <FeatureCard
          v-model="features.library"
          title="Library"
          description="Manage your board game collection with lending and tracking capabilities"
          slug="library"
          :icon="IconBooks"
          :status="getFeatureStatus('library')"
          :configurable="true"
          @configure="navigateToLibrarySettings"
        />

        <!-- Tournaments Feature -->
        <FeatureCard
          v-model="features.tournaments"
          title="Tournaments"
          description="Organize and track gaming competitions and tournaments"
          slug="tournaments"
          :icon="IconTrophy"
          :status="getFeatureStatus('tournaments')"
          :configurable="false"
        />

        <!-- Events Feature -->
        <FeatureCard
          v-model="features.events"
          title="Events"
          description="Schedule and manage event activities throughout your convention"
          slug="events"
          :icon="IconCalendarEvent"
          :status="getFeatureStatus('events')"
          :configurable="false"
        />

        <!-- Tickets Feature -->
        <FeatureCard
          v-model="features.tickets"
          title="Tickets"
          description="Sell and manage tickets for your convention and special events"
          slug="tickets"
          :icon="IconTicket"
          :status="getFeatureStatus('tickets')"
          :configurable="false"
        />

        <!-- Flea Market Feature -->
        <FeatureCard
          v-model="features.flea"
          title="Flea Market"
          description="Enable buying and selling of games and items between attendees"
          slug="flea-market"
          :icon="IconShoppingCart"
          :status="getFeatureStatus('flea')"
          :configurable="false"
        />

        <!-- Prototypes Feature (Future) -->
        <FeatureCard
          v-model="features.prototypes"
          title="Prototypes"
          description="Showcase and playtest game prototypes from designers"
          slug="prototypes"
          :icon="IconRocket"
          :status="getFeatureStatus('prototypes')"
          :configurable="false"
        />
      </div>
    </div>
  </div>
  <SettingsBottomBar :loading="isSaving" @save="saveFeatures" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  IconBooks,
  IconTrophy,
  IconCalendarEvent,
  IconTicket,
  IconShoppingCart,
  IconRocket,
} from '@tabler/icons-vue'
import FeatureCard from '@/components/FeatureCard.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import {
  saveEnabledFeatures,
  settingsStore,
} from '@/features/settings/useSettings.store.ts'
import type { Setting } from '@/features/settings/setting.model.ts'
import { RouteNames } from '@/router/routeNames'
import logger from '@/lib/logger.ts'

const router = useRouter()

// Features state
const features = ref(
  Object.entries(settingsStore.value || {}).reduce(
    (
      acc: Record<string, boolean>,
      [key, value]: [string, Setting<unknown>],
    ) => {
      acc[key] = value.enabled
      return acc || false
    },
    {},
  ),
)

// Add prototypes if it doesn't exist
if (!('prototypes' in features.value)) {
  features.value.prototypes = false
}

// Loading state for save operation
const isSaving = ref(false)

// Get feature status for badge display
const getFeatureStatus = (
  featureKey: string,
): 'complete' | 'warning' | null => {
  if (!features.value[featureKey]) {
    return null
  }

  // Library is considered complete if it has locations configured
  if (featureKey === 'library') {
    return 'complete'
  }

  // Other features show warning if enabled but not configured
  return 'warning'
}

// Navigate to library settings
const navigateToLibrarySettings = (): void => {
  void router.push({ name: RouteNames.admin.settingsLibrary })
}

// Save features function
const saveFeatures = async (): Promise<void> => {
  try {
    isSaving.value = true

    await saveEnabledFeatures(features.value)

    logger.debug('Feature settings saved successfully:', {
      value: features.value,
    })
    toast.success('Feature settings saved successfully!')
  } catch (error) {
    logger.error('Error saving feature settings:', { error })
    toast.error('Failed to save feature settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>
