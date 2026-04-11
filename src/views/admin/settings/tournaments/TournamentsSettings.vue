<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 pb-16">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Tournaments Settings
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure tournament management settings for your convention
      </p>
    </div>

    <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
      <!-- General Tournament Settings -->
      <SettingsSection
        title="General Settings"
        description="Basic tournament configuration options"
      >
        <form @submit="handleSubmit">
          <div
            class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6"
          >
            <div class="sm:col-span-6">
              <div class="flex items-center gap-3">
                <div
                  class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500"
                >
                  <span
                    class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
                  />
                  <input
                    id="allow-public-registration"
                    v-model="formData.allowPublicRegistration"
                    type="checkbox"
                    name="allow-public-registration"
                    class="absolute inset-0 appearance-none focus:outline-hidden"
                  />
                </div>
                <div class="text-sm">
                  <label
                    for="allow-public-registration"
                    class="font-medium text-gray-900 dark:text-white cursor-pointer"
                  >
                    Allow Public Registration
                  </label>
                  <p class="text-gray-500 dark:text-gray-400">
                    Let attendees register for tournaments directly
                  </p>
                </div>
              </div>
            </div>

            <CInput
              id="max-participants"
              v-model="formData.maxParticipants"
              label="Default Max Participants"
              type="number"
              name="max-participants"
              class="sm:col-span-3"
              placeholder="16"
            />

            <CInput
              id="registration-deadline"
              v-model="formData.registrationDeadline"
              label="Registration Deadline (hours before)"
              type="number"
              name="registration-deadline"
              class="sm:col-span-3"
              placeholder="24"
            />
          </div>

          <div class="mt-8 flex">
            <CButton type="submit" :loading="isSaving" loading-text="Saving...">
              Save Changes
            </CButton>
          </div>
        </form>
      </SettingsSection>

      <!-- Tournament Types -->
      <SettingsSection
        title="Tournament Types"
        description="Define the types of tournaments you'll be running"
      >
        <div class="space-y-4">
          <div class="flex gap-3">
            <CInput
              id="new-tournament-type"
              v-model="newTournamentType"
              label=""
              placeholder="e.g., Swiss, Single Elimination, Round Robin"
              class="flex-1"
              @keyup.enter="addTournamentType"
            />
            <CButton type="button" @click="addTournamentType">
              <IconPlus class="h-5 w-5 mr-2 -ml-1" />
              Add Type
            </CButton>
          </div>

          <!-- Tournament Types List -->
          <div v-if="tournamentTypes.length > 0" class="mt-6">
            <ul class="space-y-2">
              <li
                v-for="(type, index) in tournamentTypes"
                :key="index"
                class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ type }}
                </span>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  @click="removeTournamentType(index)"
                >
                  <IconTrash class="h-5 w-5" />
                  <span class="sr-only">Remove</span>
                </button>
              </li>
            </ul>
          </div>
          <div
            v-else
            class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No tournament types defined yet
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  </div>
  <SettingsBottomBar :loading="isSaving" @save="saveSettings" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { IconPlus, IconTrash } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import SettingsBottomBar from '@/components/SettingsBottomBar.vue'
import logger from '@/lib/logger.ts'

const formData = ref({
  allowPublicRegistration: true,
  maxParticipants: '16',
  registrationDeadline: '24',
})

const tournamentTypes = ref<string[]>([
  'Swiss',
  'Single Elimination',
  'Double Elimination',
  'Round Robin',
])

const newTournamentType = ref('')
const isSaving = ref(false)

const addTournamentType = (): void => {
  if (!newTournamentType.value.trim()) {
    toast.error('Please enter a tournament type name')
    return
  }

  if (tournamentTypes.value.includes(newTournamentType.value.trim())) {
    toast.error('This tournament type already exists')
    return
  }

  tournamentTypes.value.push(newTournamentType.value.trim())
  newTournamentType.value = ''
  toast.success('Tournament type added')
}

const removeTournamentType = (index: number): void => {
  tournamentTypes.value.splice(index, 1)
  toast.success('Tournament type removed')
}

const saveSettings = async (): Promise<void> => {
  try {
    await Promise.resolve()
    isSaving.value = true

    logger.debug('Saving tournament settings:', {
      formData: formData.value,
      tournamentTypes: tournamentTypes.value,
    })

    toast.success('Tournament settings saved successfully!')
  } catch (error) {
    logger.error('Error saving tournament settings:', { error })
    toast.error('Failed to save settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}

const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()
  if (isSaving.value) return
  await saveSettings()
}
</script>
