/**
 * Shape exposed by `TournamentDetailsRoster.vue` through a template ref. The
 * dialog footer owns the confirm button, so it drives the sign-up form from
 * the outside through these.
 */
export interface TournamentDetailsRosterInstance {
  submit: () => void
  /** Brings the roster into view — the point of opening from the join button. */
  scrollIntoView: () => void
  isSubmitting: boolean
  /** How many sign-ups are staged but not yet confirmed. */
  stagedCount: number
}
