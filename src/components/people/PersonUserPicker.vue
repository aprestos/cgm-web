<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegle } from '@regle/core'
import { email as emailRule, minLength, required } from '@regle/rules'
import { IconSearch, IconUserPlus } from '@tabler/icons-vue'
import CInput from '@/components/CInput.vue'
import CCombobox from '@/components/CCombobox.vue'
import FormTabs, { type TabConfig } from '@/components/FormTabs.vue'
import type { Option } from '@/components/select.types'
import { type User, userService } from '@/features/users/service.ts'
import type { PickedPerson } from './person.model.ts'

/**
 * Picks a person either off an existing account or off a name and an email
 * someone types — the walk-in who never signed up.
 *
 * It only picks — the caller saves. Reach for `PersonPicker` instead of this
 * unless the screen ignores tickets whatever the tenant has enabled.
 *
 * The wording is the same wherever it is mounted, so it comes straight from
 * `common.personPicker` rather than from the screen around it. The button that
 * does something with the pick belongs to the screen: put it in the `action`
 * slot, and have it call `pick()`.
 */
interface Props {
  /** Distinguishes the fields from others on the page */
  id?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  id: 'person-user',
  disabled: false,
})

const { t } = useI18n()

const SEARCH_TAB = 0

const tab = ref<number>(SEARCH_TAB)
const selectedUserId = ref<string | null>(null)
// The combobox hands back an id, but a pick is handed on as a name and an
// email — so the accounts behind the last results are kept to look them up.
const searchedUsers = new Map<string, User>()
const manualForm = ref({ name: '', email: '' })
// The search tab has nothing to validate until someone asks for the pick —
// the manual tab has regle for that, this is the combobox's equivalent.
const searchErrors = ref<string[]>([])

watch(selectedUserId, () => {
  searchErrors.value = []
})

const { r$: manualR$ } = useRegle(manualForm, {
  name: { required, minLength: minLength(2) },
  email: { required, email: emailRule },
})

const tabs = computed<TabConfig[]>(() => [
  {
    label: t('common.personPicker.tabSearch'),
    icon: IconSearch,
  },
  {
    label: t('common.personPicker.tabManual'),
    icon: IconUserPlus,
  },
])

async function searchUsers(query: string): Promise<Option<string>[]> {
  const results = await userService.search(query)

  return results.map((user) => {
    searchedUsers.set(user.id, user)
    return {
      value: user.id,
      label: user.name || user.email,
      secondaryLabel: user.email ? `(${user.email})` : undefined,
    }
  })
}

/**
 * Pulls the person out of whichever tab is open, reporting on the tab itself
 * if it is not ready. `null` means there is no one to hand over.
 *
 * Public: the screen's own action button calls this.
 */
async function pick(): Promise<PickedPerson | null> {
  if (tab.value === SEARCH_TAB) {
    const user = selectedUserId.value
      ? searchedUsers.get(selectedUserId.value)
      : undefined
    if (!user) {
      searchErrors.value = [t('common.validation.required')]
      return null
    }

    return {
      source: 'user',
      name: user.name || user.email,
      email: user.email,
      userId: user.id,
    }
  }

  const { valid, data } = await manualR$.$validate()
  if (!valid) return null

  return {
    source: 'manual',
    name: data.name.trim(),
    email: data.email.trim(),
  }
}

/** Clears both tabs — the caller calls this once its save went through */
function reset(): void {
  tab.value = SEARCH_TAB
  selectedUserId.value = null
  searchedUsers.clear()
  searchErrors.value = []
  manualR$.$reset({ toInitialState: true })
}

defineExpose({ pick, reset })
</script>

<template>
  <div>
    <FormTabs v-model="tab" :tabs="tabs">
      <!-- Tab 0: an account that already exists -->
      <template #tab-0>
        <CCombobox
          :id="`${id}-search`"
          v-model="selectedUserId"
          :label="t('common.personPicker.personLabel')"
          :placeholder="t('common.personPicker.personPlaceholder')"
          :disabled="disabled"
          :errors="searchErrors"
          :search-fn="searchUsers"
        />
      </template>

      <!-- Tab 1: a walk-in with no account behind them -->
      <template #tab-1>
        <div class="space-y-4">
          <CInput
            :id="`${id}-name`"
            v-model="manualForm.name"
            :label="t('common.personPicker.nameLabel')"
            :placeholder="t('common.personPicker.namePlaceholder')"
            :disabled="disabled"
            :errors="manualR$.$errors.name"
          />
          <CInput
            :id="`${id}-email`"
            v-model="manualForm.email"
            type="email"
            :label="t('common.personPicker.emailLabel')"
            :placeholder="t('common.personPicker.emailPlaceholder')"
            :disabled="disabled"
            :errors="manualR$.$errors.email"
          />
        </div>
      </template>
    </FormTabs>

    <!-- Under both tabs rather than inside each: the action means the same
         thing whichever way the person was named. -->
    <div v-if="$slots.action" class="flex justify-end">
      <slot name="action" />
    </div>
  </div>
</template>
