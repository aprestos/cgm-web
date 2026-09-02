/**
 * Shared option shape for the two select components.
 *
 * CSelect (Listbox — pick from a short, fixed list) and CCombobox (type to
 * filter, locally or remotely) render the same rows via CSelectOption, so the
 * item type lives here rather than in either component. Call sites import it
 * from this module, not from the component they happen to be using.
 */
export interface Option<TValue> {
  value: TValue
  label: string
  /** Dimmed suffix after the label: an email, a year, any disambiguator. */
  secondaryLabel?: string
}
