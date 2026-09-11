import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CButton from '@/components/CButton.vue'
import {
  BUTTON_VARIANT,
  BUTTON_VARIANT_PRESSED,
  type ButtonVariant,
} from '@/components/button.styles'

describe('CButton toggle state', () => {
  // Vue casts an absent boolean prop to `false`, which would put
  // aria-pressed="false" on every Save and Cancel in the app and have screen
  // readers announce them as unpressed toggles. The `pressed: undefined`
  // default is what stops it — this test is what keeps that default honest.
  it('omits aria-pressed on a button that is not a toggle', () => {
    const wrapper = mount(CButton)

    expect(wrapper.attributes('aria-pressed')).toBeUndefined()
  })

  it('renders aria-pressed for both states of a toggle', () => {
    expect(
      mount(CButton, { props: { pressed: false } }).attributes('aria-pressed'),
    ).toBe('false')
    expect(
      mount(CButton, { props: { pressed: true } }).attributes('aria-pressed'),
    ).toBe('true')
  })

  // Appending the on-colour would not have worked: Tailwind orders utilities
  // itself, so the resting background has to be gone, not just outranked.
  it('drops the resting background when pressed', () => {
    const off = mount(CButton, { props: { variant: 'secondary' } })
    const on = mount(CButton, {
      props: { variant: 'secondary', pressed: true },
    })

    expect(off.classes()).toContain('bg-white')
    expect(on.classes()).not.toContain('bg-white')
    expect(on.classes()).toContain('bg-gray-100')
  })

  // An on button holds the colour it wears while you are clicking it. This is
  // the rule BUTTON_VARIANT_PRESSED is built from, checked against the resting
  // map itself so the two cannot drift apart as variants are added or retuned.
  const variants = Object.keys(BUTTON_VARIANT) as ButtonVariant[]

  const background = (
    classes: readonly string[],
    dark: boolean,
  ): string | undefined =>
    classes.find((c) => c.startsWith(dark ? 'dark:bg-' : 'bg-'))

  const activeBackground = (
    classes: readonly string[],
    dark: boolean,
  ): string | undefined =>
    classes
      .find((c) => c.startsWith(dark ? 'dark:active:bg-' : 'active:bg-'))
      ?.replace('active:', '')

  it.each(variants)('pressed %s wears its own active background', (variant) => {
    for (const dark of [false, true]) {
      expect(background(BUTTON_VARIANT_PRESSED[variant], dark)).toBe(
        activeBackground(BUTTON_VARIANT[variant], dark),
      )
    }
  })

  // An on button must not simply look like a resting one — which the rule above
  // guarantees only as long as no variant's active colour equals its own
  // resting colour.
  it.each(variants)(
    'pressed %s is distinct from its resting self',
    (variant) => {
      const off = mount(CButton, { props: { variant } })
      const on = mount(CButton, { props: { variant, pressed: true } })

      expect(background(on.classes(), false)).not.toBe(
        background(off.classes(), false),
      )
    },
  )

  it('keeps size, width and radius independent of the toggle state', () => {
    const on = mount(CButton, {
      props: { pressed: true, size: 'sm', fullWidth: true, rounded: true },
    })

    expect(on.classes()).toEqual(
      expect.arrayContaining(['px-3', 'py-1.5', 'w-full', 'rounded-full']),
    )
  })
})
