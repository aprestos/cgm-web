/**
 * Shape exposed by `TournamentSignUpForm.vue` through a template ref.
 * Lives outside the SFC so consumers can import it with full type information.
 */
export interface TournamentSignUpFormInstance {
  /** Emits `confirm` with everyone staged so far. */
  submit: () => void
  canSubmit: boolean
  isSubmitting: boolean
  /** How many sign-ups are staged but not yet confirmed. */
  stagedCount: number
}
