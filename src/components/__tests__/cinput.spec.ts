import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import CInput from '@/components/CInput.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: { common: { actions: { clear: 'Clear' } } } },
})

const flush = async (ms: number): Promise<void> => {
  await new Promise((r) => setTimeout(r, ms))
  await nextTick()
}

const mountInput = (
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> = {},
): VueWrapper =>
  mount(CInput, {
    props: { id: 'field', modelValue: '', ...props },
    attrs,
    global: { plugins: [i18n] },
  })

describe('CInput attribute forwarding', () => {
  // The wrapper used to swallow these: `step` landed on the <div>, so number
  // fields silently had no step at all.
  it('forwards unknown attrs to the input, not the wrapper', () => {
    const wrapper = mountInput(
      { type: 'number' },
      { step: '0.01', autocomplete: 'email', maxlength: '10' },
    )
    const input = wrapper.find('input')

    expect(input.attributes('step')).toBe('0.01')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('maxlength')).toBe('10')
  })

  it('keeps class on the wrapper so grid placement still works', () => {
    const wrapper = mountInput({}, { class: 'sm:col-span-6' })

    expect(wrapper.classes()).toContain('sm:col-span-6')
    expect(wrapper.classes()).toContain('col-span-full')
    expect(wrapper.find('input').classes()).not.toContain('sm:col-span-6')
  })
})

describe('CInput debounce', () => {
  it('emits synchronously when no debounce is set', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('abc')

    expect(wrapper.emitted('update:modelValue')).toEqual([['abc']])
  })

  it('delays the emit while keeping the displayed value instant', async () => {
    const wrapper = mountInput({ debounce: 100 })
    const input = wrapper.find('input')
    await input.setValue('ab')

    expect(input.element.value).toBe('ab')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await flush(150)
    expect(wrapper.emitted('update:modelValue')).toEqual([['ab']])
  })

  it('emits only once for a burst of keystrokes', async () => {
    const wrapper = mountInput({ debounce: 100 })
    const input = wrapper.find('input')

    await input.setValue('a')
    await input.setValue('ab')
    await input.setValue('abc')
    await flush(150)

    expect(wrapper.emitted('update:modelValue')).toEqual([['abc']])
  })

  it('flushes a pending emit on blur', async () => {
    const wrapper = mountInput({ debounce: 1000 })
    const input = wrapper.find('input')

    await input.setValue('typed')
    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']])
  })

  it('flushes a pending emit on Enter', async () => {
    const wrapper = mountInput({ debounce: 1000 })
    const input = wrapper.find('input')

    await input.setValue('typed')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']])
  })
})

describe('CInput clearable', () => {
  it('shows no clear button while empty', () => {
    expect(mountInput({ clearable: true }).find('button').exists()).toBe(false)
  })

  it('clears the value and emits', async () => {
    const wrapper = mountInput({ clearable: true, modelValue: 'text' })
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})

describe('CInput accessibility', () => {
  it('wires aria-invalid and aria-describedby when errors are present', () => {
    const input = mountInput({
      errors: ['Required'],
      helperText: 'Some hint',
    }).find('input')

    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      'field-helper field-error',
    )
  })

  it('sets no aria-invalid when valid', () => {
    const input = mountInput().find('input')

    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBeUndefined()
  })
})
