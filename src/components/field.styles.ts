/**
 * Shared class maps for form fields (CInput, CTextArea, CSelect,
 * CCombobox).
 *
 * These used to be copy-pasted class strings living inside each component,
 * which is how CInput and CTextArea ended up with two different helper-text
 * styles. Keep every visual decision about a field shell in this file.
 *
 * Style follows CButton.vue: plain string maps, no cva/clsx. `tailwind-merge`
 * is in package.json but is deliberately unused across src/.
 */

/**
 * Corner radius is a field-wide decision, so it lives here rather than in each
 * component — changing it repaints CInput, CTextArea, CSelect and CCombobox
 * together.
 * It stays out of FIELD_BASE only so the pill variant can swap it without
 * fighting class order.
 */
export const FIELD_RADIUS = 'rounded-xl'
export const FIELD_RADIUS_PILL = 'rounded-full'

/** Everything a field shell shares. Radius and size are applied separately so
 *  callers can override them without fighting class order. */
export const FIELD_BASE =
  'block w-full bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 transition-colors'

/**
 * Hover darkens the resting outline so the field reads as interactive.
 *
 * `enabled:` keeps a disabled field from lighting up under the cursor.
 * `not-focus:` is load-bearing: Tailwind emits `hover:` AFTER `focus:`, so
 * without it, mousing over an already-focused field would repaint its primary
 * focus outline grey.
 */
export const FIELD_STATE = {
  default:
    'outline-gray-300 enabled:not-focus:hover:outline-gray-400 focus:outline-primary-600 dark:outline-white/10 dark:enabled:not-focus:hover:outline-white/25 dark:focus:outline-primary-500',
  error:
    'outline-red-300 enabled:not-focus:hover:outline-red-400 focus:outline-red-600 dark:outline-red-400 dark:enabled:not-focus:hover:outline-red-300 dark:focus:outline-red-500',
} as const

/**
 * Composite controls (CCombobox) paint the outline on a wrapper, because the
 * focusable element is a descendant sitting alongside buttons. Same palette as
 * FIELD_BASE/FIELD_STATE, driven by `focus-within` instead of `focus`.
 *
 * These have to be spelled out rather than derived: Tailwind only sees class
 * names that appear literally in the source.
 */
export const FIELD_SHELL_BASE =
  'relative w-full overflow-hidden bg-white dark:bg-white/5 text-left outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 transition-colors'

export const FIELD_SHELL_STATE = {
  default:
    'outline-gray-300 not-focus-within:hover:outline-gray-400 focus-within:outline-primary-600 dark:outline-white/10 dark:not-focus-within:hover:outline-white/25 dark:focus-within:outline-primary-500',
  error:
    'outline-red-300 not-focus-within:hover:outline-red-400 focus-within:outline-red-600 dark:outline-red-400 dark:not-focus-within:hover:outline-red-300 dark:focus-within:outline-red-500',
} as const

/** The inner control of a shell: inherits the wrapper's surface and outline. */
export const FIELD_SHELL_INPUT =
  'w-full border-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-0'

export const FIELD_DISABLED =
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-white/[0.02]'

export type FieldSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Deliberately NOT CButton's padding scale. A button pads horizontally around
 * centred text, so its `px` grows with its size; an input's text is left
 * aligned against the leading edge, where a wide `px` only pushes the caret
 * inward and wastes the field. So horizontal padding stays nearly flat and
 * height is carried by `py`.
 *
 * There is also no `md:` step-down on `py`. Buttons shrink on desktop to fit
 * toolbars, but a field that thin reads as cramped next to its label — only
 * the font size steps down, and the height holds.
 *
 * `text-base` on small screens is load-bearing: iOS zooms the page when a
 * focused input renders below 16px.
 *
 * Resulting heights (mobile / desktop), line-height + padding:
 *   sm 32/28px · md 44/40px · lg 52px · xl 60/56px
 */
export const FIELD_SIZE: Record<FieldSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm md:text-xs',
  md: 'px-3 py-3 text-base md:text-sm',
  lg: 'px-3.5 py-3.5 text-base',
  xl: 'px-4 py-4 text-lg md:text-base',
}

/** Padding that keeps text clear of an icon. Tailwind emits `pl-*` after
 *  `px-*`, so these win over the size map's horizontal padding. */
export const FIELD_ICON_PAD_LEFT: Record<FieldSize, string> = {
  sm: 'pl-9',
  md: 'pl-10',
  lg: 'pl-11',
  xl: 'pl-13',
}

export const FIELD_ICON_PAD_RIGHT: Record<FieldSize, string> = {
  sm: 'pr-9',
  md: 'pr-10',
  lg: 'pr-11',
  xl: 'pr-13',
}

/** Inset of the absolutely positioned icon container. */
export const FIELD_ICON_INSET_LEFT: Record<FieldSize, string> = {
  sm: 'pl-2.5',
  md: 'pl-3',
  lg: 'pl-3.5',
  xl: 'pl-4',
}

export const FIELD_ICON_INSET_RIGHT: Record<FieldSize, string> = {
  sm: 'pr-2.5',
  md: 'pr-3',
  lg: 'pr-3.5',
  xl: 'pr-4',
}

/** Applied to the icon container so a slotted icon scales with the field
 *  regardless of the size classes the caller put on it. */
export const FIELD_ICON_SIZE: Record<FieldSize, string> = {
  sm: '[&_svg]:size-4',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-5',
  xl: '[&_svg]:size-6',
}

/**
 * The dropdown panel shared by CSelect and CCombobox. Radius is applied
 * separately, as everywhere else in this file.
 *
 * `w-full` anchors it to the field, so the wrapper it sits in must be
 * `relative`.
 */
export const FIELD_PANEL =
  'absolute z-20 mt-1 max-h-60 w-full overflow-auto bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-gray-200 dark:ring-white/10 focus:outline-none md:text-sm'

export const LABEL_CLASSES =
  'block text-xs font-semibold text-gray-500 dark:text-gray-100 uppercase tracking-wider'

export const HELPER_CLASSES = 'mt-2 text-sm text-gray-500 dark:text-gray-400'
