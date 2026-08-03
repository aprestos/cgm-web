/**
 * English message catalog — the source of truth for all locales.
 *
 * Structure: top-level namespaces mirror the app areas in `src/views/`:
 *   common  — strings shared across areas (actions, state, validation)
 *   auth    — sign-in / verification flows
 *   landing — marketing site + checkout
 *   public  — attendee app (library, games, reservations)
 *   admin   — admin area (navigation, library, tickets, orders, check-in)
 *
 * Placement rules:
 * 1. A string used on one screen goes under `<area>.<page>.*`; shared across
 *    pages of one area under `<area>.<domain>.*`; shared across areas in `common`.
 * 2. Enum-label maps (targets of dynamic lookups like
 *    t(`admin.tickets.status.${value}`)) live in a sub-object named after the
 *    enum, and their keys match the data values verbatim — the only place
 *    kebab-case keys are allowed. Everything else is camelCase.
 * 3. Other locales (e.g. `pt/`) mirror this file layout with DeepPartial
 *    contents; missing keys fall back to English at runtime.
 */
import admin from './admin'
import auth from './auth'
import common from './common'
import landing from './landing'
import publicArea from './public'

/**
 * Helper type to convert literal string types to string
 * This allows other locales to have different string values
 */
type StringifyValues<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? StringifyValues<T[K]>
      : T[K]
}

const en = {
  common,
  auth,
  landing,
  public: publicArea,
  admin,
}

export type TranslationSchema = StringifyValues<typeof en>

export default en as TranslationSchema
