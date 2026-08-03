import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CSelect2 from '@/CSelect2.vue'

const flush = async (ms: number): Promise<void> => {
  await new Promise((r) => setTimeout(r, ms))
  await nextTick()
}

type SearchOption = { value: string; label: string }

const makeSearchFn = (
  latency: number,
): ((query: string) => Promise<SearchOption[]>) =>
  vi.fn(async (query: string) => {
    await new Promise((r) => setTimeout(r, latency))
    return [
      { value: 'g1', label: 'Catan' },
      { value: 'g2', label: 'Catan Junior' },
    ].filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
  })

describe('CSelect2 with searchFn', () => {
  it('selects an option on mousedown and displays its label', async () => {
    const searchFn = makeSearchFn(50)
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, searchFn, label: 'Game' },
      attachTo: document.body,
    })

    const input = wrapper.find('input')
    await input.setValue('cat')
    await flush(450)

    const options = wrapper.findAll('li')
    expect(options.length).toBe(2)

    await options[0].trigger('mousedown', { button: 0 })
    await wrapper.setProps({ modelValue: 'g1' })
    await flush(50)

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['g1'])
    expect(input.element.value).toBe('Catan')
  })

  it('shows loading state immediately while the search is pending', async () => {
    const searchFn = makeSearchFn(200)
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, searchFn, label: 'Game' },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('catan')
    await nextTick()

    expect(wrapper.text()).toContain('Loading')
  })

  it('Enter while search is pending keeps the dropdown open, then selects', async () => {
    const searchFn = makeSearchFn(200)
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, searchFn, label: 'Game' },
      attachTo: document.body,
    })

    const input = wrapper.find('input')
    await input.setValue('catan')
    // user hits Enter right away (debounce hasn't even fired)
    await input.trigger('keydown', { key: 'Enter' })
    await flush(700)

    // dropdown must still be open with the results, nothing selected yet
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.findAll('li').length).toBe(2)

    // Enter now selects the first (auto-active) option
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['g1'])
  })

  it('Enter after results load selects the first option', async () => {
    const searchFn = makeSearchFn(50)
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, searchFn, label: 'Game' },
      attachTo: document.body,
    })

    const input = wrapper.find('input')
    await input.setValue('catan')
    await flush(450)
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['g1'])
  })
})

describe('CSelect2 with static items', () => {
  const items = [
    { value: 1, label: 'Sala 1' },
    { value: 2, label: 'Armazém' },
  ]

  it('opens the full list from the chevron button and selects', async () => {
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, items, label: 'Location' },
      attachTo: document.body,
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    const options = wrapper.findAll('li')
    expect(options.map((o) => o.text())).toEqual(['Sala 1', 'Armazém'])

    await options[1].trigger('mousedown', { button: 0 })
    await wrapper.setProps({ modelValue: 2 })
    await flush(50)

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([2])
    expect(wrapper.find('input').element.value).toBe('Armazém')
  })

  it('filters items as the user types', async () => {
    const wrapper = mount(CSelect2, {
      props: { modelValue: null, items, label: 'Location' },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('sal')
    await nextTick()

    const options = wrapper.findAll('li')
    expect(options.map((o) => o.text())).toEqual(['Sala 1'])
  })
})
