import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { mdiHome } from '@mdi/js'
import Icon from '../Icon.vue'

describe('Icon', () => {
  it('renders with default props', () => {
    const wrapper = mount(Icon, {
      props: { icon: mdiHome }
    })
    
    expect(wrapper.find('svg')).toBeTruthy()
    expect(wrapper.attributes('width')).toBe('24')
    expect(wrapper.attributes('height')).toBe('24')
    expect(wrapper.attributes('viewBox')).toBe('0 0 24 24')
  })

  it('applies custom size', () => {
    const wrapper = mount(Icon, {
      props: { 
        icon: mdiHome,
        size: 32
      }
    })
    
    expect(wrapper.attributes('width')).toBe('32')
    expect(wrapper.attributes('height')).toBe('32')
  })

  it('applies custom classes', () => {
    const wrapper = mount(Icon, {
      props: { 
        icon: mdiHome,
        class: 'text-red-500 custom-class'
      }
    })
    
    expect(wrapper.classes()).toContain('text-red-500')
    expect(wrapper.classes()).toContain('custom-class')
    expect(wrapper.classes()).toContain('inline-block')
  })

  it('renders the correct icon path', () => {
    const wrapper = mount(Icon, {
      props: { icon: mdiHome }
    })
    
    const path = wrapper.find('path')
    expect(path.attributes('d')).toBe(mdiHome)
  })
})
