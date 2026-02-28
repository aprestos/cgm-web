<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 pb-16">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Events Settings
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure event scheduling and management for your convention
      </p>
    </div>

    <div class="space-y-10 divide-y divide-gray-200 dark:divide-white/10">
      <!-- General Event Settings -->
      <SettingsSection
        title="General Settings"
        description="Basic event configuration options"
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
                    id="allow-public-submission"
                    v-model="formData.allowPublicSubmission"
                    type="checkbox"
                    name="allow-public-submission"
                    class="absolute inset-0 appearance-none focus:outline-hidden"
                  />
                </div>
                <div class="text-sm">
                  <label
                    for="allow-public-submission"
                    class="font-medium text-gray-900 dark:text-white cursor-pointer"
                    >Allow Public Event Submission</label
                  >
                  <p class="text-gray-500 dark:text-gray-400">
                    Let attendees propose events for your schedule
                  </p>
                </div>
              </div>
            </div>

            <div class="sm:col-span-6">
              <div class="flex items-center gap-3">
                <div
                  class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500"
                >
                  <span
                    class="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5"
                  />
                  <input
                    id="require-approval"
                    v-model="formData.requireApproval"
                    type="checkbox"
                    name="require-approval"
                    class="absolute inset-0 appearance-none focus:outline-hidden"
                  />
                </div>
                <div class="text-sm">
                  <label
                    for="require-approval"
                    class="font-medium text-gray-900 dark:text-white cursor-pointer"
                    >Require Approval for Submissions</label
                  >
                  <p class="text-gray-500 dark:text-gray-400">
                    Review and approve events before they appear in schedule
                  </p>
                </div>
              </div>
            </div>

            <CInput
              id="default-duration"
              v-model="formData.defaultDuration"
              label="Default Event Duration (minutes)"
              type="number"
              name="default-duration"
              class="sm:col-span-3"
              placeholder="60"
            />

            <CInput
              id="max-capacity"
              v-model="formData.maxCapacity"
              label="Default Max Capacity"
              type="number"
              name="max-capacity"
              class="sm:col-span-3"
              placeholder="20"
            />
          </div>

          <div class="mt-8 flex">
            <CButton type="submit" :loading="isSaving" loading-text="Saving...">
              Save Changes
            </CButton>
          </div>
        </form>
      </SettingsSection>

      <!-- Event Categories -->
      <SettingsSection
        title="Event Categories"
        description="Define categories to organize your events"
      >
        <div class="space-y-4">
          <div class="flex gap-3">
            <CInput
              id="new-category"
              v-model="newCategory"
              label=""
              placeholder="e.g., Workshop, Panel, Game Session"
              class="flex-1"
              @keyup.enter="addCategory"
            />
            <CButton type="button" @click="addCategory">
              <IconPlus class="h-5 w-5 mr-2 -ml-1" />
              Add Category
            </CButton>
          </div>

          <!-- Categories List -->
          <div v-if="categories.length > 0" class="mt-6">
            <ul class="space-y-2">
              <li
                v-for="(category, index) in categories"
                :key="index"
                class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ category }}
                </span>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  @click="removeCategory(index)"
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
              No categories defined yet
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

// Form data
const formData = ref({
  allowPublicSubmission: false,
  requireApproval: true,
  defaultDuration: '60',
  maxCapacity: '20',
})

const categories = ref<string[]>([
  'Workshop',
  'Panel Discussion',
  'Game Session',
  'Demo',
  'Tournament',
])

const newCategory = ref('')
const isSaving = ref(false)

// Add category
const addCategory = (): void => {
  if (!newCategory.value.trim()) {
    toast.error('Please enter a category name')
    return
  }

  if (categories.value.includes(newCategory.value.trim())) {
    toast.error('This category already exists')
    return
  }

  categories.value.push(newCategory.value.trim())
  newCategory.value = ''
  toast.success('Category added')
}

// Remove category
const removeCategory = (index: number): void => {
  categories.value.splice(index, 1)
  toast.success('Category removed')
}

// Save settings
const saveSettings = async (): Promise<void> => {
  try {
    await Promise.resolve()
    isSaving.value = true

    // TODO: Implement actual save to backend
    logger.debug('Saving events settings:', {
      formData: formData.value,
      categories: categories.value,
    })

    toast.success('Events settings saved successfully!')
  } catch (error) {
    logger.error('Error saving events settings:', { error })
    toast.error('Failed to save settings. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Handle form submit
const handleSubmit = async (event: Event): Promise<void> => {
  event.preventDefault()
  if (isSaving.value) return
  await saveSettings()
}
</script>
