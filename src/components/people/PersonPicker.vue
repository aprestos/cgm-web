<script setup lang="ts">
import { computed, ref } from 'vue'
import PersonTicketPicker from './PersonTicketPicker.vue'
import PersonUserPicker from './PersonUserPicker.vue'
import { useSettingsStore } from '@/features/settings/useSettings.store.ts'
import type { PersonPickerApi, PickedPerson } from './person.model.ts'

/**
 * One way to name a person, wherever a screen needs one.
 *
 * Where tickets are sold a person belongs to an issuance rather than to a name
 * someone typed, so that is the only way to pick them; everywhere else they
 * come off an account or off a typed name and email. This component makes that
 * call from the tenant's settings and hands the caller the same
 * {@link PickedPerson} either way.
 *
 * It picks but never saves, and it has no button of its own: the screen that
 * holds the context — which tournament, which table, what counts as a
 * duplicate — owns the action, names it, and reports the outcome. Ask for the
 * person from that button, which validates whichever tab is open, and call
 * `reset()` once the save went through. Naming a person reads the same on
 * every screen, so the wording of the fields is the picker's own, out of
 * `common.personPicker`.
 *
 * A screen whose action belongs with the picker passes it in the `action`
 * slot, which lands it where that variant wants it — beside the field, or
 * under the tabs:
 *
 * ```vue
 * <PersonPicker ref="picker" :disabled="isSaving">
 *   <template #action>
 *     <CButton :loading="isSaving" @click="add">Add</CButton>
 *   </template>
 * </PersonPicker>
 * ```
 *
 * ```ts
 * const person = await picker.value?.pick()
 * if (!person) return
 * ```
 *
 * A screen with its own footer — a dialog that withdraws a game to someone,
 * say — leaves the slot empty and calls `pick()` from the button it already
 * has.
 */
type PersonPickerMode = 'auto' | 'ticket' | 'user'

interface Props {
  /**
   * `auto` follows the tickets feature setting. Pin it to `ticket` or `user`
   * on a screen that means one of them whatever the tenant has enabled.
   */
  mode?: PersonPickerMode
  /** Distinguishes the fields from others on the page */
  id?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'auto',
  id: 'person',
  disabled: false,
})

const settingsStore = useSettingsStore()

const usesTickets = computed<boolean>(() =>
  props.mode === 'auto'
    ? !!settingsStore?.settings?.tickets?.enabled
    : props.mode === 'ticket',
)

const ticketPicker = ref<PersonPickerApi | null>(null)
const userPicker = ref<PersonPickerApi | null>(null)

// Only one of the two is ever mounted, so whichever is there is the one the
// screen is looking at.
const mounted = computed(() => ticketPicker.value ?? userPicker.value)

/** The person on the open tab, or `null` with the tab reporting why not */
async function pick(): Promise<PickedPerson | null> {
  return (await mounted.value?.pick()) ?? null
}

/** Clears the pick */
function reset(): void {
  mounted.value?.reset()
}

defineExpose({ pick, reset })
</script>

<template>
  <PersonTicketPicker
    v-if="usesTickets"
    :id="id"
    ref="ticketPicker"
    :disabled="disabled"
  >
    <template v-if="$slots.action" #action><slot name="action" /></template>
  </PersonTicketPicker>

  <PersonUserPicker v-else :id="id" ref="userPicker" :disabled="disabled">
    <template v-if="$slots.action" #action><slot name="action" /></template>
  </PersonUserPicker>
</template>
