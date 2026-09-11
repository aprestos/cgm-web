/**
 * Someone picked through `PersonPicker`, whichever way they were found.
 *
 * The three sources carry different weight: a `ticket` pick is the only one
 * that ties the person to an issuance, a `user` pick is the only one backed by
 * an account, and `manual` is a name and an address someone typed. Name and
 * email are always filled in, so a caller that only needs to label the person
 * can ignore `source` entirely.
 */
export type PersonSource = 'ticket' | 'user' | 'manual'

export interface PickedPerson {
  source: PersonSource
  name: string
  email: string
  /** Set on a `ticket` pick */
  ticketIssuanceId?: string
  /** Set on a `user` pick */
  userId?: string
}

/**
 * What every picker exposes. Type a template ref with this rather than with
 * `InstanceType<typeof PersonPicker>`, which resolves to `any` outside a
 * Vue-aware type checker.
 */
export interface PersonPickerApi {
  /** The person on the open tab, or `null` with the tab reporting why not */
  pick: () => Promise<PickedPerson | null>
  /** Clears the pick, for once the caller's save went through */
  reset: () => void
}
