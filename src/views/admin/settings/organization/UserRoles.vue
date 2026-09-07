<template>
  <SettingsSection
    :title="t('admin.settings.roles.title')"
    :description="t('admin.settings.roles.description')"
  >
    <div v-if="hasCreatePermission" class="mb-4 flex justify-end">
      <CButton size="sm" @click="isAddOpen = true">
        <template #icon-left>
          <IconPlus class="size-4" aria-hidden="true" />
        </template>
        {{ t('admin.settings.roles.add.button') }}
      </CButton>
    </div>

    <DataTable
      :items="userRoles"
      :columns="columns"
      :loading="isLoading"
      :items-per-page="20"
      row-key="userId"
    >
      <!-- User cell -->
      <template #cell-user="{ item }">
        <div class="flex items-center gap-3">
          <CAvatar
            :initials="initialsFor(item)"
            :alt="item.user?.name ?? item.user?.email ?? ''"
            size="sm"
          />
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-900 dark:text-white">
              {{ item.user?.name || t('admin.settings.roles.unknownUser') }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ item.user?.email || '—' }}
            </p>
          </div>
        </div>
      </template>

      <!-- Role cell — super-admin is read-only, everything else is editable -->
      <template #cell-role="{ item }">
        <CBadge
          v-if="item.role === 'super-admin'"
          type="purple"
          size="sm"
          :text="t(`admin.settings.roles.role.${item.role}`)"
        />
        <CSelect
          v-else
          :id="`user-role-${item.userId}`"
          :model-value="item.role"
          :items="roleOptions"
          size="sm"
          :disabled="!hasUpdatePermission || !!updatingUserId"
          class="w-44"
          @update:model-value="(role) => onRoleChange(item, role)"
        />
      </template>

      <!-- Created cell -->
      <template #cell-createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <!-- Actions — super-admin cannot be removed here -->
      <template #actions="{ item }">
        <CButton
          v-if="item.role !== 'super-admin'"
          variant="transparent"
          size="sm"
          :disabled="!hasDeletePermission"
          @click="requestRemove(item)"
        >
          <template #icon-left>
            <IconTrash class="h-4 w-4 text-red-500" aria-hidden="true" />
          </template>
        </CButton>
      </template>
    </DataTable>

    <p
      v-if="!isLoading && userRoles.length === 0"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('admin.settings.roles.empty') }}
    </p>

    <DialogAddUserRole
      :open="isAddOpen"
      :existing-user-ids="existingUserIds"
      @added="onUserAdded"
      @close="isAddOpen = false"
    />

    <ConfirmationDialog
      :open="!!userToRemove"
      :title="t('admin.settings.roles.removeTitle')"
      :message="
        t('admin.settings.roles.removeMessage', { name: removeTargetName })
      "
      :confirm-text="t('admin.settings.roles.removeConfirm')"
      :cancel-text="t('common.actions.cancel')"
      :loading="isRemoving"
      @confirm="confirmRemove"
      @close="userToRemove = null"
    />
  </SettingsSection>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { IconPlus, IconTrash } from '@tabler/icons-vue'
import SettingsSection from '@/components/SettingsSection.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import CAvatar from '@/components/CAvatar.vue'
import CBadge from '@/components/CBadge.vue'
import CButton from '@/components/CButton.vue'
import CSelect from '@/components/CSelect.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import DialogAddUserRole from './DialogAddUserRole.vue'
import roleService from '@/features/roles/service.ts'
import {
  type AppRole,
  ASSIGNABLE_ROLES,
  type UserRole,
} from '@/features/roles/role.model.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import logger from '@/lib/logger.ts'
import { authService } from '@/features/auth/service.ts'

const tenantStore = useTenantStore()

const { t } = useI18n()

const columns: DataTableColumn<UserRole>[] = [
  { key: 'user', label: t('admin.settings.roles.columnUser'), sortable: false },
  { key: 'role', label: t('admin.settings.roles.columnRole'), sortable: false },
  {
    key: 'createdAt',
    label: t('admin.settings.roles.columnAdded'),
    breakpoint: 'sm',
  },
]

const userRoles = ref<UserRole[]>([])
const isLoading = ref(false)
const updatingUserId = ref<string | null>(null)

const hasCreatePermission = ref<boolean>(false)
const hasUpdatePermission = ref<boolean>(false)
const hasDeletePermission = ref<boolean>(false)

const userToRemove = ref<UserRole | null>(null)
const isRemoving = ref(false)

const isAddOpen = ref(false)

const existingUserIds = computed(() => userRoles.value.map((r) => r.userId))

const removeTargetName = computed(
  () =>
    userToRemove.value?.user?.name ||
    userToRemove.value?.user?.email ||
    t('admin.settings.roles.thisUser'),
)

const initialsFor = (item: UserRole): string => {
  const source = item.user?.name || item.user?.email || '?'
  return source
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const formatDate = (value: string): string => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

const loadUserRoles = async (): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  if (!tenantId) return

  isLoading.value = true
  try {
    userRoles.value = await roleService.getAll(tenantId)
  } catch (error) {
    logger.error('Error loading user roles:', { error })
    toast.error(t('admin.settings.roles.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

const loadPermissions = async (): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  if (!tenantId) return

  // NOTE: keep `isLoading` scoped to role loading to avoid races with `loadUserRoles()`
  try {
    const [create, update, remove] = await Promise.allSettled([
      authService.hasPermission('roles', 'create'),
      authService.hasPermission('roles', 'update'),
      authService.hasPermission('roles', 'delete'),
    ])

    const resolvePermission = (
      result: PromiseSettledResult<boolean>,
      action: string,
    ): boolean => {
      if (result.status === 'fulfilled') return result.value
      logger.error('Error loading permission', {
        domain: 'roles',
        action,
        error: result.reason,
      })
      return false
    }

    hasCreatePermission.value = resolvePermission(create, 'create')
    hasUpdatePermission.value = resolvePermission(update, 'update')
    hasDeletePermission.value = resolvePermission(remove, 'delete')
  } finally {
    isLoading.value = false
  }
}

const roleOptions = computed(() =>
  ASSIGNABLE_ROLES.map((role) => ({
    value: role,
    label: t(`admin.settings.roles.role.${role}`),
  })),
)

const onRoleChange = async (
  item: UserRole,
  newRole: AppRole | null,
): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  if (!tenantId || !newRole || newRole === item.role) return

  updatingUserId.value = item.userId
  try {
    const updated = await roleService.updateRole(tenantId, item.userId, newRole)
    item.role = updated.role
    toast.success(t('admin.settings.roles.updateSuccess'))
  } catch (error) {
    logger.error('Error updating role:', { error })
    toast.error(t('admin.settings.roles.updateFailed'))
    // Nothing to roll back: the row is bound to item.role, which is only
    // written on success — the old select held its own value and had to be
    // pushed back by hand.
  } finally {
    updatingUserId.value = null
  }
}

// `assign` upserts, so a returning user comes back as an update of their row
// rather than as a second one — the dialog blocks that case, but a role added
// from another tab would still land here.
const onUserAdded = (userRole: UserRole): void => {
  const index = userRoles.value.findIndex((r) => r.userId === userRole.userId)
  if (index === -1) userRoles.value.push(userRole)
  else userRoles.value[index] = userRole
}

const requestRemove = (item: UserRole): void => {
  userToRemove.value = item
}

const confirmRemove = async (): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  const target = userToRemove.value
  if (!tenantId || !target) return

  isRemoving.value = true
  try {
    await roleService.remove(tenantId, target.userId)
    userRoles.value = userRoles.value.filter((r) => r.userId !== target.userId)
    toast.success(t('admin.settings.roles.removeSuccess'))
    userToRemove.value = null
  } catch (error) {
    logger.error('Error removing user:', { error })
    toast.error(t('admin.settings.roles.removeFailed'))
  } finally {
    isRemoving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUserRoles(), loadPermissions()])
})
</script>
