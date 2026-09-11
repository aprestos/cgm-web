/**
 * Shared class maps for CButton.
 *
 * Split out of the component for the same reason field.styles.ts was split out
 * of the fields: what was left inside CButton.vue was ~200 lines of Tailwind
 * data around ~15 lines of logic, and the data drowned the logic. Keep every
 * visual decision about a button in this file; CButton.vue only picks between
 * these lists and joins them.
 *
 * These are arrays where field.styles.ts uses plain strings — the lists here
 * run to a dozen classes with dark-mode and state pairs, and a single 400-char
 * string per variant is not reviewable. No cva/clsx either way; `tailwind-merge`
 * is in package.json but is deliberately unused across src/.
 *
 * Radius is NOT here: it is shared with the fields and lives in
 * field.styles.ts, so a button and the input above it round off together.
 */

export type ButtonVariant =
  | 'primary'
  | 'soft'
  | 'secondary'
  | 'tertiary'
  | 'yellow'
  | 'danger'
  | 'transparent'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Press feedback lives here rather than in the variants because it has to
 * behave the same everywhere. Touch devices never get :hover, and the one they
 * do get sticks after the finger lifts, so :active is what actually tells
 * someone the tap landed. `transition` (not transition-colors) so the scale
 * animates; :active cannot match a disabled button, so the press states need no
 * disabled guard.
 */
export const BUTTON_BASE: readonly string[] = [
  'inline-flex',
  'items-center',
  'justify-center',
  'font-medium',
  'transition',
  'duration-150',
  'focus-visible:outline',
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'cursor-pointer',
  'active:scale-[0.97]',
  'motion-reduce:active:scale-100',
  // Removes the ~300ms double-tap-zoom wait, and the grey flash Android and
  // iOS paint over the top of our own press state.
  'touch-manipulation',
  '[-webkit-tap-highlight-color:transparent]',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
]

/**
 * A button sits a little tighter than the field beside it — 48/36 at md, 48/48
 * at lg, 56/52 at xl — rather than matching it outright. Deliberately close but
 * not equal: the desktop step used to be 12px, which read as misalignment,
 * while a 4px difference reads as a button being a button.
 *
 * Horizontal padding never steps down. A button pads around centred text, so
 * its px should stay visibly wider than the field's at every width; the old
 * `md:px-*` step collapsed the two to the same 12px at `md`, which made a
 * desktop button look pinched against the input above it. Field px for
 * comparison: 10 / 12 / 14 / 16.
 *
 * `sm` keeps its own thinner vertical scale: it is the size that rides in
 * toolbars and table rows, where height is the scarce thing.
 *
 * Gaps live on the content span (the actual flex container), not here.
 */
export const BUTTON_SIZE: Record<ButtonSize, readonly string[]> = {
  sm: ['px-3', 'py-1.5', 'text-sm', 'md:text-xs'],
  md: ['px-4', 'py-3', 'text-base', 'md:py-2', 'md:text-sm'],
  lg: ['px-5', 'py-3', 'text-base'],
  xl: ['px-6', 'py-3.5', 'text-lg', 'md:text-base'],
}

/**
 * Flat surfaces, colour-only hover. No coloured glows and no shadow growth on
 * hover: those read as marketing CTAs, not app controls. Hover lightens a
 * filled button; pressing pushes it past its resting colour in the other
 * direction, so a press never looks like a lingering hover.
 */
export const BUTTON_VARIANT: Record<ButtonVariant, readonly string[]> = {
  primary: [
    'bg-primary-600',
    'text-white',
    'shadow-xs',
    'hover:bg-primary-500',
    'active:bg-primary-700',
    'focus-visible:outline-primary-600',
    'dark:bg-primary-500',
    'dark:shadow-none',
    'dark:hover:bg-primary-400',
    'dark:active:bg-primary-600',
    'dark:focus-visible:outline-primary-500',
  ],
  // Brand hue, unfilled. For actions that are clearly interactive but are not
  // the one thing the screen is asking for — an "add another" inside a form
  // whose real submit sits in the footer. Deliberately shares primary's hue
  // rather than introducing a neutral: a per-tenant theme repaints one hue and
  // both variants follow, which a black/white variant could not do.
  soft: [
    'bg-primary-50',
    'text-primary-700',
    'ring-1',
    'ring-inset',
    'ring-primary-200',
    'hover:bg-primary-100',
    'active:bg-primary-200',
    'focus-visible:outline-primary-600',
    'dark:bg-primary-500/10',
    'dark:text-primary-300',
    'dark:ring-primary-400/20',
    'dark:hover:bg-primary-500/20',
    'dark:active:bg-primary-500/25',
    'dark:focus-visible:outline-primary-500',
  ],
  secondary: [
    'bg-white',
    'text-gray-900',
    'shadow-xs',
    'ring-1',
    'ring-inset',
    'ring-gray-300',
    'hover:bg-gray-50',
    'active:bg-gray-100',
    'focus-visible:outline-primary-600',
    'dark:bg-white/10',
    'dark:text-white',
    'dark:shadow-none',
    'dark:ring-white/10',
    'dark:hover:bg-white/20',
    'dark:active:bg-white/25',
    'dark:focus-visible:outline-primary-500',
  ],
  tertiary: [
    'bg-gray-100',
    'text-gray-900',
    'shadow-xs',
    'hover:bg-gray-200',
    'active:bg-gray-300',
    'focus-visible:outline-gray-500',
    'dark:bg-gray-700',
    'dark:text-white',
    'dark:shadow-none',
    'dark:hover:bg-gray-600',
    'dark:active:bg-gray-500',
    'dark:focus-visible:outline-gray-400',
  ],
  yellow: [
    'bg-amber-500',
    'text-white',
    'shadow-xs',
    'hover:bg-amber-400',
    'active:bg-amber-600',
    'focus-visible:outline-amber-500',
    'dark:shadow-none',
    'dark:hover:bg-amber-400',
    'dark:active:bg-amber-600',
    'dark:focus-visible:outline-amber-500',
  ],
  danger: [
    'bg-red-600',
    'text-white',
    'shadow-xs',
    'hover:bg-red-500',
    'active:bg-red-700',
    'focus-visible:outline-red-600',
    'dark:bg-red-500',
    'dark:shadow-none',
    'dark:hover:bg-red-400',
    'dark:active:bg-red-600',
    'dark:focus-visible:outline-red-500',
  ],
  transparent: [
    'bg-transparent',
    'text-gray-700',
    'hover:bg-gray-100',
    'active:bg-gray-200',
    'focus-visible:outline-gray-500',
    'dark:text-gray-300',
    'dark:hover:bg-gray-800',
    'dark:active:bg-gray-700',
    'dark:focus-visible:outline-gray-400',
  ],
}

/**
 * The on-state of a toggle: what the button looks like *while* you are clicking
 * it, held. Every list below is its variant's list with the backgrounds moved
 * one notch along that variant's own ramp — `bg-*` becomes the variant's
 * `active:bg-*`, and hover/active step one further in the same direction.
 * `pressedBackgroundMatchesActive` in cbutton.spec.ts asserts the first half of
 * that mechanically, so the two maps cannot drift apart.
 *
 * Each variant keeps its own hue, text, ring and shadow: an on `soft` is a
 * deeper `soft`, not a filled `primary`. That is the point — a toggle answers
 * "am I on" in the language of the button you already recognise.
 *
 * A whole replacement list per variant, not a few overrides appended to the
 * resting one: Tailwind emits utilities in its own order, so `bg-primary-700`
 * after `bg-primary-600` in the class attribute does not win — only removing
 * the loser does. And nothing here can be derived from BUTTON_VARIANT at
 * runtime: Tailwind only emits class names that appear literally in the source,
 * and `active:bg-primary-700` compiles to a `:active` rule, not a bare
 * `.bg-primary-700`. Same reason field.styles.ts spells out its shell states.
 *
 * Hover and active share a value throughout. A toggle's click changes state, so
 * `:active` has little left to say, and doubling up keeps every variant one
 * step from the end of its ramp rather than two — which is what keeps the label
 * readable on the light end (soft, secondary, tertiary).
 */
export const BUTTON_VARIANT_PRESSED: Record<ButtonVariant, readonly string[]> =
  {
    primary: [
      'bg-primary-700',
      'text-white',
      'shadow-xs',
      'hover:bg-primary-800',
      'active:bg-primary-800',
      'focus-visible:outline-primary-600',
      'dark:bg-primary-600',
      'dark:shadow-none',
      'dark:hover:bg-primary-700',
      'dark:active:bg-primary-700',
      'dark:focus-visible:outline-primary-500',
    ],
    // The ring steps with the fill. At its resting `primary-200` it would be the
    // same colour as the on-state's background and so no ring at all, which would
    // leave the on chip the only one in a row without an edge.
    soft: [
      'bg-primary-200',
      'text-primary-700',
      'ring-1',
      'ring-inset',
      'ring-primary-300',
      'hover:bg-primary-300',
      'active:bg-primary-300',
      'focus-visible:outline-primary-600',
      'dark:bg-primary-500/25',
      'dark:text-primary-300',
      'dark:ring-primary-400/30',
      'dark:hover:bg-primary-500/35',
      'dark:active:bg-primary-500/35',
      'dark:focus-visible:outline-primary-500',
    ],
    secondary: [
      'bg-gray-100',
      'text-gray-900',
      'shadow-xs',
      'ring-1',
      'ring-inset',
      'ring-gray-300',
      'hover:bg-gray-200',
      'active:bg-gray-200',
      'focus-visible:outline-primary-600',
      'dark:bg-white/25',
      'dark:text-white',
      'dark:shadow-none',
      'dark:ring-white/10',
      'dark:hover:bg-white/35',
      'dark:active:bg-white/35',
      'dark:focus-visible:outline-primary-500',
    ],
    // The one variant whose dark ramp runs toward *lighter* greys, so an on
    // tertiary in dark mode is a light surface and takes dark text. White at
    // `gray-500` is 3.9:1 — fine for the moment a click lasts, not for a state
    // that stays on screen until you toggle it off.
    tertiary: [
      'bg-gray-300',
      'text-gray-900',
      'shadow-xs',
      'hover:bg-gray-400',
      'active:bg-gray-400',
      'focus-visible:outline-gray-500',
      'dark:bg-gray-500',
      'dark:text-gray-900',
      'dark:shadow-none',
      'dark:hover:bg-gray-400',
      'dark:active:bg-gray-400',
      'dark:focus-visible:outline-gray-400',
    ],
    yellow: [
      'bg-amber-600',
      'text-white',
      'shadow-xs',
      'hover:bg-amber-700',
      'active:bg-amber-700',
      'focus-visible:outline-amber-500',
      'dark:bg-amber-600',
      'dark:shadow-none',
      'dark:hover:bg-amber-700',
      'dark:active:bg-amber-700',
      'dark:focus-visible:outline-amber-500',
    ],
    danger: [
      'bg-red-700',
      'text-white',
      'shadow-xs',
      'hover:bg-red-800',
      'active:bg-red-800',
      'focus-visible:outline-red-600',
      'dark:bg-red-600',
      'dark:shadow-none',
      'dark:hover:bg-red-700',
      'dark:active:bg-red-700',
      'dark:focus-visible:outline-red-500',
    ],
    transparent: [
      'bg-gray-200',
      'text-gray-700',
      'hover:bg-gray-300',
      'active:bg-gray-300',
      'focus-visible:outline-gray-500',
      'dark:bg-gray-700',
      'dark:text-gray-300',
      'dark:hover:bg-gray-600',
      'dark:active:bg-gray-600',
      'dark:focus-visible:outline-gray-400',
    ],
  }

/** Gap between a label and its slotted icons, on the content span. */
export const BUTTON_CONTENT_GAP: Record<ButtonSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
  xl: 'gap-2.5',
}

/**
 * Matched to the label so the button keeps its height while loading, which
 * means it tracks the responsive label size too.
 */
export const BUTTON_SPINNER_SIZE: Record<ButtonSize, string> = {
  sm: 'size-4 md:size-3.5',
  md: 'size-4.5 md:size-4',
  lg: 'size-4.5 md:size-4.5',
  xl: 'size-5 md:size-4.5',
}
