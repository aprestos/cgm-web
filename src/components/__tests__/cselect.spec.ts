import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import CSelect from '@/components/CSelect.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: { common: { actions: { clear: 'Clear' } } } },
})

const items = [
  { value: 1, label: 'Sala 1' },
  { value: 2, label: 'Armazém', secondaryLabel: '(piso -1)' },
]

const mountSelect = (props: Record<string, unknown> = {}): VueWrapper =>
  mount(CSelect, {
    props: {
      id: 'location',
      modelValue: null,
      items,
      label: 'Location',
      ...props,
    },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })

describe('CSelect', () => {
  it('shows the placeholder until something is picked, then the label', async () => {
    const wrapper = mountSelect({ placeholder: 'Pick a location' })
    expect(wrapper.find('button').text()).toBe('Pick a location')

    await wrapper.setProps({ modelValue: 2 })
    expect(wrapper.find('button').text()).toContain('Armazém')
    // the secondary label rides along in the trigger, as it does in the list
    expect(wrapper.find('button').text()).toContain('(piso -1)')
  })

  it('opens the full list on click and emits the picked value', async () => {
    const wrapper = mountSelect()

    await wrapper.find('button').trigger('click')
    await nextTick()

    const options = wrapper.findAll('li')
    expect(options.map((o) => o.text())).toEqual([
      'Sala 1',
      'Armazém (piso -1)',
    ])

    await options[0].trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([1])
  })

  it('marks only the selected row with the check icon', async () => {
    const wrapper = mountSelect({ modelValue: 2 })

    await wrapper.find('button').trigger('click')
    await nextTick()

    const options = wrapper.findAll('li')
    expect(options[0].find('svg').exists()).toBe(false)
    expect(options[1].find('svg').exists()).toBe(true)
  })

  it('clears back to null only when clearable', async () => {
    const plain = mountSelect({ modelValue: 1 })
    expect(plain.findAll('button').length).toBe(1)

    const wrapper = mountSelect({ modelValue: 1, clearable: true })
    const clear = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Clear'))
    await clear?.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([null])
  })
})
