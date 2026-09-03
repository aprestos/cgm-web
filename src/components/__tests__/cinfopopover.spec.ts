import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import CInfoPopover from '@/components/CInfoPopover.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: {
        comingSoon: {
          title: 'Coming soon',
          message: 'This is still being built and will be available soon.',
        },
      },
    },
  },
})

// The panel is teleported, so every wrapper is torn down between tests —
// otherwise its panel is still in the body when the next one looks there.
let wrappers: VueWrapper[] = []

const mountPopover = (
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> = {},
): VueWrapper => {
  const wrapper = mount(CInfoPopover, {
    props,
    attrs,
    slots: { default: '<span class="icon" />' },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

const panel = (): HTMLElement | null =>
  document.body.querySelector('[role="dialog"]')

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
  document.body.innerHTML = ''
})

describe('CInfoPopover', () => {
  it('stays closed until the trigger is clicked', async () => {
    const wrapper = mountPopover()
    expect(panel()).toBeNull()

    await wrapper.get('button').trigger('click')

    expect(panel()).not.toBeNull()
  })

  // No screen passes its own wording: an unconfigured popover is the shared
  // coming-soon label.
  it('falls back to the common coming-soon label', async () => {
    const wrapper = mountPopover()
    await wrapper.get('button').trigger('click')

    const text = panel()?.textContent ?? ''
    expect(text).toContain('Coming soon')
    expect(text).toContain(
      'This is still being built and will be available soon.',
    )
  })

  it('takes a message and a description of its own when given one', async () => {
    const wrapper = mountPopover({
      message: 'Deleting is on the way.',
      description: 'It lands with the participant count change.',
    })
    await wrapper.get('button').trigger('click')

    const text = panel()?.textContent ?? ''
    expect(text).toContain('Deleting is on the way.')
    expect(text).toContain('It lands with the participant count change.')
    expect(text).not.toContain('This is still being built')
  })

  it('closes on Escape', async () => {
    const wrapper = mountPopover()
    await wrapper.get('button').trigger('click')
    expect(panel()).not.toBeNull()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    const emitted = wrapper.emitted('update:open') ?? []
    expect(emitted[emitted.length - 1]).toEqual([false])
  })

  // The trigger keeps whatever styling and labelling the call site gave it.
  it('forwards attrs to the trigger button', () => {
    const wrapper = mountPopover({}, { class: 'p-1.5', 'aria-label': 'Delete' })
    const trigger = wrapper.get('button')

    expect(trigger.classes()).toContain('p-1.5')
    expect(trigger.attributes('aria-label')).toBe('Delete')
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  // A trigger that unmounts on click (a menu item) hands over its own anchor,
  // so the component must not render a button of its own.
  it('renders no trigger when an external anchor drives it', async () => {
    const anchor = document.createElement('button')
    document.body.appendChild(anchor)

    const wrapper = mountPopover({ anchor, open: true })
    await nextTick()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(panel()).not.toBeNull()
  })
})
