<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CCombobox from '@/components/CCombobox.vue'
import type { Option } from '@/components/select.types'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'
import ticketIssuanceService from '@/features/tickets/issuance.service.ts'
import type { TicketIssuance } from '@/features/tickets/ticket.model.ts'
import type { PickedPerson } from './person.model.ts'

/**
 * Picks an attendee out of the tickets issued for the active edition. Where
 * tickets are sold there is nothing to type: a person is whoever holds an
 * issuance, so the search is the whole form.
 *
 * It only picks — the caller saves. Reach for `PersonPicker` instead of this
 * unless the screen is ticket-only whatever the tenant has enabled.
 *
 * The wording is the same wherever it is mounted, so it comes straight from
 * `common.personPicker` rather than from the screen around it. The button that
 * does something with the pick belongs to the screen: put it in the `action`
 * slot, and have it call `pick()`.
 */
interface Props {
  /** Distinguishes the field from others on the page */
  id?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  id: 'person-ticket',
  disabled: false,
})

const { t } = useI18n()

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

const selectedTicketId = ref<string | null>(null)
// The combobox hands back an id, but the caller is given a name and an email
// too — so the issuances behind the last results are kept to look them up.
const searchedTickets = new Map<string, TicketIssuance>()
// Reported on the field itself when someone asks for the pick without having
// made one — the manual forms elsewhere have regle for this.
const searchErrors = ref<string[]>([])

watch(selectedTicketId, () => {
  searchErrors.value = []
})

async function searchTickets(query: string): Promise<Option<string>[]> {
  if (!tenantStore?.tenant?.id || !editionStore?.edition?.id) return []

  const results: TicketIssuance[] = await ticketIssuanceService.search(
    tenantStore.tenant.id,
    editionStore.edition.id,
    query,
  )

  return results.map((ticket) => {
    searchedTickets.set(ticket.id, ticket)
    return {
      value: ticket.id,
      label: ticket.attendeeName,
      secondaryLabel: ticket.attendeeEmail
        ? `(${ticket.attendeeEmail})`
        : undefined,
    }
  })
}

/**
 * The attendee behind the pick, reporting on the field if there is none.
 *
 * Public: the screen's own action button calls this.
 */
// eslint-disable-next-line @typescript-eslint/require-await -- one shape with the other pickers, whose tabs validate asynchronously
async function pick(): Promise<PickedPerson | null> {
  const ticket = selectedTicketId.value
    ? searchedTickets.get(selectedTicketId.value)
    : undefined

  if (!ticket) {
    searchErrors.value = [t('common.validation.required')]
    return null
  }

  return {
    source: 'ticket',
    name: ticket.attendeeName,
    email: ticket.attendeeEmail,
    ticketIssuanceId: ticket.id,
  }
}

/** Clears the pick — the caller calls this once its save went through */
function reset(): void {
  selectedTicketId.value = null
  searchedTickets.clear()
  searchErrors.value = []
}

defineExpose({ pick, reset })
</script>

<template>
  <!-- There is only the one field, so the screen's action — when it has one —
       sits beside it. items-end lines it up with the field rather than with
       the label above it. -->
  <div class="flex flex-row items-end gap-3">
    <CCombobox
      :id="id"
      v-model="selectedTicketId"
      class="flex-1"
      :label="t('common.personPicker.ticketLabel')"
      :placeholder="t('common.personPicker.ticketPlaceholder')"
      :disabled="disabled"
      :errors="searchErrors"
      :search-fn="searchTickets"
    />
    <slot name="action" />
  </div>
</template>
