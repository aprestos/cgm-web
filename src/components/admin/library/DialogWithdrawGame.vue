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
        <!-- The dialog's footer already carries the action, so the picker's
             `action` slot is left empty — it is asked for the person on
             submit. -->
        <PersonPicker
          id="withdraw-user"
          ref="picker"
          mode="user"
          :disabled="isSubmitting"
        />

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
          <CButton
            type="button"
            variant="secondary"
            size="lg"
            class="order-2 sm:order-1 w-full sm:w-auto"
            @click="emit('close')"
          >
            {{ t('common.actions.cancel') }}
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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'

import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import PersonPicker from '@/components/people/PersonPicker.vue'
import type {
  PersonPickerApi,
  PickedPerson,
} from '@/components/people/person.model.ts'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import libraryWithdrawService from '@/features/library/withdraws/service.ts'
import { userService } from '@/features/users/service.ts'
import logger from '@/lib/logger.ts'
import {
  IconCalendarFilled,
  IconMapPin,
  IconArrowBarUp,
} from '@tabler/icons-vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

const { t } = useI18n()
const tenantStore = useTenantStore()
const editionStore = useEditionStore()

interface Props {
  open: boolean
  game: LibraryGame | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const isSubmitting = ref(false)
const picker = ref<PersonPickerApi | null>(null)

/**
 * A withdrawal is recorded against an account, so someone typed into the
 * picker's second tab gets one before the game leaves the shelf. `null` means
 * the account could not be created and the withdrawal must not go ahead.
 */
const resolveUserId = async (person: PickedPerson): Promise<string | null> => {
  if (person.userId) return person.userId

  try {
    const created = await userService.create(person.name, person.email)
    toast.success(t('admin.library.userCreated', { email: created.email }))
    return created.id
  } catch (error) {
    logger.error('Failed to create a user to withdraw a game to', { error })
    // The service speaks for itself here — "this email is already taken" is
    // worth more than a generic failure.
    toast.error(
      error instanceof Error
        ? error.message
        : t('admin.library.createUserFailed'),
    )
    return null
  }
}

const submit = async (): Promise<void> => {
  if (isSubmitting.value) return

  // The picker reports on its own fields when there is no one to hand over.
  const person = await picker.value?.pick()
  if (!person) return

  const tenantId = tenantStore.tenant?.id
  const editionId = editionStore.edition?.id
  if (!tenantId || !editionId) return

  isSubmitting.value = true
  try {
    const userId = await resolveUserId(person)
    if (!userId) return

    // Call the withdraw service
    await libraryWithdrawService.create(
      tenantId,
      editionId,
      props.game?.id as number,
      userId,
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
  }
}

// The dialog stays mounted between openings, so the last withdrawal's person
// would still be sitting in the picker.
watch(
  () => props.open,
  (open) => {
    if (open) picker.value?.reset()
  },
)

// Expose the submit function so parent components can call it
defineExpose({
  submit,
})
</script>
