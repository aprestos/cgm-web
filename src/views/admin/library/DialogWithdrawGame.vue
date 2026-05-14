<template>
  <DialogComponent
    :open="open"
    :title="t('admin.library.withdrawGame')"
    @close="emit('close')"
  >
    <div class="space-y-8">
      <!-- Game Card -->
      <div class="">
        <div class="flex items-center space-x-4">
          <div class="shrink-0">
            <img
              class="size-16 rounded-lg object-cover shadow-sm"
              :src="game?.game.image || '/placeholder-game.jpg'"
              :alt="game?.game.name || t('admin.library.unknownGame')"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white truncate"
            >
              {{ game?.game.name || t('admin.library.unknownGame') }}
            </h3>
            <div
              class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="flex items-center">
                <IconCalendarFilled class="size-4 mr-1" />
                {{ game?.game.year || t('admin.library.unknown') }}
              </span>
              <span v-if="game?.location?.name" class="flex items-center">
                <IconMapPin class="size-4 mr-1" />
                {{ game?.location?.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Withdraw Form -->
      <form class="space-y-6" @submit.prevent="submit">
        <FormTabs
          v-model="selectedTab"
          :tabs="tabs"
          @tab-change="handleTabChange"
        >
          <!-- Tab 0: Search User -->
          <template #tab-0>
            <CSelect2
              id="user"
              v-model="formData.selectedUser"
              :label="t('admin.library.withdrawTo')"
              :placeholder="t('admin.library.searchAndSelectUser')"
              :search-fn="
                async (query) => {
                  const results = await userService.search(query)
                  return results.map((item) => ({
                    value: item.id,
                    label: item.name,
                    secondaryLabel: item.email ? `(${item.email})` : undefined,
                  })) as Array<Option<string>>
                }
              "
              :errors="r$.$errors.selectedUser"
            />
          </template>

          <!-- Tab 1: Create User -->
          <template #tab-1>
            <div class="space-y-4">
              <CInput
                id="new-user-name"
                v-model="newUser.name"
                :label="t('auth.displayName')"
                type="text"
                :placeholder="t('auth.enterDisplayName')"
                :errors="newUserR$.$errors.name"
              />
              <CInput
                id="new-user-email"
                v-model="newUser.email"
                :label="t('auth.email')"
                type="email"
                :placeholder="t('auth.enterEmailPlaceholder')"
                :errors="newUserR$.$errors.email"
              />
            </div>
          </template>
        </FormTabs>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
          <CButton
            type="button"
            variant="secondary"
            size="lg"
            class="order-2 sm:order-1 w-full sm:w-auto"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </CButton>
          <CButton
            type="submit"
            variant="yellow"
            size="lg"
            class="order-1 sm:order-2 w-full sm:w-auto"
            :loading="isSubmitting"
            :loading-text="t('admin.library.withdrawing')"
          >
            <IconArrowBarUp class="size-4 mr-2" />
            {{ t('admin.library.withdrawGame') }}
          </CButton>
        </div>
      </form>
    </div>
  </DialogComponent>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core'
import { required, email, minLength } from '@regle/rules'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'

import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import FormTabs from '@/components/FormTabs.vue'
import type { TabConfig } from '@/components/FormTabs.vue'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'
import { userService } from '@/features/users/service.ts'
import logger from '@/lib/logger.ts'
import type { Option } from 'vue3-select-component'
import CSelect2 from '@/CSelect2.vue'
import {
  IconSearch,
  IconUserPlus,
  IconCalendarFilled,
  IconMapPin,
  IconArrowBarUp,
} from '@tabler/icons-vue'

const { t } = useI18n()

interface Props {
  open: boolean
  game: LibraryGame | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const formData = ref({ selectedUser: undefined as string | undefined })

const isSubmitting = ref(false)

const newUser = ref({
  email: '',
  name: '',
})

const selectedTab = ref<number>(0)

const tabs = computed<TabConfig[]>(() => [
  {
    label: t('admin.library.searchUser'),
    icon: IconSearch,
  },
  {
    label: t('admin.library.createUser'),
    icon: IconUserPlus,
  },
])

const handleTabChange = (index: number): void => {
  selectedTab.value = index
}

// Main form validation
const { r$ } = useRegle(formData, {
  selectedUser: { required },
})

// New user form validation
const { r$: newUserR$ } = useRegle(newUser, {
  email: { required, email },
  name: { required, minLength: minLength(2) },
})

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  if (selectedTab.value === 1) {
    await createUser()
  }

  // Validate form before submitting
  const { valid, data } = await r$.$validate()

  if (!valid) {
    logger.debug('Form has validation errors')
    return
  }

  try {
    // Call the withdraw service
    await libraryWithdrawService.create(
      props.game?.id as number,
      data.selectedUser,
    )

    toast.success(
      t('admin.library.withdrawSuccess', { name: props.game?.game.name }),
    )

    emit('close')
  } catch (error) {
    logger.error('Failed to withdraw game', { error })
    toast.error(t('admin.library.withdrawFailed'))
  } finally {
    isSubmitting.value = false
    newUser.value = {
      email: '',
      name: '',
    }
  }
}

const createUser = async (): Promise<void> => {
  // Validate new user form
  const { valid, data } = await newUserR$.$validate()

  if (!valid) {
    logger.debug('New user form has validation errors')
    return
  }

  try {
    //Call the user creation service
    const response = await userService.create(data.name, data.email)

    toast.success(`User ${response.email} created successfully.`)

    // Automatically select the newly created user for withdrawal
    formData.value.selectedUser = response.id

    // Reset new user form and hide it
    newUser.value.email = ''
    newUser.value.name = ''

    // Reset validation state
    newUserR$.$reset()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create user'
    toast.error(message)
    isSubmitting.value = false
  }
}

// Expose the submit function so parent components can call it
defineExpose({
  submit,
})
</script>
