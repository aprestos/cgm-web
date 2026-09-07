<template>
  <DialogComponent
    :open="open"
    :title="t('admin.settings.roles.add.title')"
    @close="emit('close')"
  >
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <CCombobox
          id="add-role-user"
          v-model="formData.userId"
          :label="t('admin.settings.roles.add.userLabel')"
          :placeholder="t('admin.settings.roles.add.userPlaceholder')"
          :search-fn="searchUsers"
          :errors="userErrors"
          required
        />

        <CSelect
          id="add-role-role"
          v-model="formData.role"
          :label="t('admin.settings.roles.add.roleLabel')"
          :placeholder="t('admin.settings.roles.add.rolePlaceholder')"
          :items="roleOptions"
          :errors="r$.$errors.role"
          required
        />
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
        <CButton
          type="button"
          variant="secondary"
          size="lg"
          class="order-2 w-full sm:order-1 sm:w-auto"
          @click="emit('close')"
        >
          {{ t('common.actions.cancel') }}
        </CButton>
        <CButton
          type="submit"
          variant="primary"
          size="lg"
          class="order-1 w-full sm:order-2 sm:w-auto"
          :loading="isSubmitting"
          :loading-text="t('common.actions.submitting')"
        >
          {{ t('admin.settings.roles.add.submit') }}
        </CButton>
      </div>
    </form>
  </DialogComponent>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { useRegle } from '@regle/core'
import { required } from '@regle/rules'
import DialogComponent from '@/components/DialogComponent.vue'
import CButton from '@/components/CButton.vue'
import CCombobox from '@/components/CCombobox.vue'
import CSelect from '@/components/CSelect.vue'
import type { Option } from '@/components/select.types'
import {
  type AppRole,
  ASSIGNABLE_ROLES,
  type UserRole,
} from '@/features/roles/role.model.ts'
import roleService from '@/features/roles/service.ts'
import { userService } from '@/features/users/service.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger.ts'

const tenantStore = useTenantStore()

interface Props {
  open: boolean
  /** Users already holding a role here — picking one again is rejected. */
  existingUserIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  /** The assignment the server stored, so the table can take it as-is. */
  added: [userRole: UserRole]
}>()

const { t } = useI18n()

const formData = ref<{ userId: string | null; role: AppRole | null }>({
  userId: null,
  role: null,
})
const isSubmitting = ref<boolean>(false)

const { r$ } = useRegle(formData, {
  userId: { required },
  role: { required },
})

const roleOptions = computed<Option<AppRole>[]>(() =>
  ASSIGNABLE_ROLES.map((role) => ({
    value: role,
    label: t(`admin.settings.roles.role.${role}`),
  })),
)

// `assign` upserts, so a duplicate would silently overwrite the role of a user
// already in the table instead of adding anyone — say so at the field.
const isDuplicate = computed<boolean>(
  () =>
    !!formData.value.userId &&
    props.existingUserIds.includes(formData.value.userId),
)

const userErrors = computed<string[]>(() =>
  isDuplicate.value
    ? [t('admin.settings.roles.add.alreadyMember')]
    : r$.$errors.userId,
)

const searchUsers = async (query: string): Promise<Option<string>[]> => {
  const results = await userService.search(query)

  return results.map((user) => ({
    value: user.id,
    label: user.name || user.email,
    secondaryLabel: user.name && user.email ? `(${user.email})` : undefined,
  }))
}

const submit = async (): Promise<void> => {
  if (isSubmitting.value || isDuplicate.value) return

  const tenantId = tenantStore.tenant?.id
  if (!tenantId) return

  const { valid, data } = await r$.$validate()
  if (!valid) return

  isSubmitting.value = true
  try {
    const userRole = await roleService.assign(tenantId, data.userId, data.role)
    toast.success(t('admin.settings.roles.add.success'))
    emit('added', userRole)
    emit('close')
  } catch (error) {
    logger.error('Error assigning role:', { error })
    toast.error(t('admin.settings.roles.add.failed'))
  } finally {
    isSubmitting.value = false
  }
}

// The dialog is kept mounted by its parent, so each opening has to start from
// a clean form rather than from the last submission.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    formData.value = { userId: null, role: null }
    r$.$reset()
  },
)
</script>
