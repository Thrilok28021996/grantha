import { describe, it, expect } from 'vitest'
import { sameStrings, tagAvatarColor, orderedNumber, orderedLabel } from './editorUtils'
import type { Block } from '../lib/blocks'

describe('sameStrings', () => {
  it('returns true for identical arrays', () => {
    expect(sameStrings(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('returns true for empty arrays', () => {
    expect(sameStrings([], [])).toBe(true)
  })

  it('returns false for different lengths', () => {
    expect(sameStrings(['a'], ['a', 'b'])).toBe(false)
  })

  it('returns false for different values', () => {
    expect(sameStrings(['a', 'b'], ['a', 'c'])).toBe(false)
  })

  it('is order-sensitive', () => {
    expect(sameStrings(['a', 'b'], ['b', 'a'])).toBe(false)
  })
})

describe('tagAvatarColor', () => {
  it('returns a valid HSL string', () => {
    const color = tagAvatarColor('hello')
    expect(color).toMatch(/^hsl\(\d+, 42%, 46%\)$/)
  })

  it('is deterministic', () => {
    expect(tagAvatarColor('test')).toBe(tagAvatarColor('test'))
  })

  it('produces different colors for different names', () => {
    expect(tagAvatarColor('alpha')).not.toBe(tagAvatarColor('omega'))
  })
})

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: 1,
  type: 'paragraph',
  text: '',
  level: 0,
  checked: undefined,
  ordered: undefined,
  ordinal: undefined,
  lang: undefined,
  fence: undefined,
  anchor: undefined,
  collapsed: false,
  ...overrides
})

describe('orderedNumber', () => {
  it('returns 1 for the first item', () => {
    const blocks = [makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 })]
    expect(orderedNumber(blocks, 0)).toBe(1)
  })

  it('counts consecutive ordered siblings', () => {
    const blocks = [
      makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 }),
      makeBlock({ id: 2, type: 'bullet', ordered: true, level: 0 }),
      makeBlock({ id: 3, type: 'bullet', ordered: true, level: 0 })
    ]
    expect(orderedNumber(blocks, 0)).toBe(1)
    expect(orderedNumber(blocks, 1)).toBe(2)
    expect(orderedNumber(blocks, 2)).toBe(3)
  })

  it('restarts after a non-ordered sibling', () => {
    const blocks = [
      makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 }),
      makeBlock({ id: 2, type: 'bullet', ordered: false, level: 0 }),
      makeBlock({ id: 3, type: 'bullet', ordered: true, level: 0 })
    ]
    expect(orderedNumber(blocks, 2)).toBe(1)
  })

  it('skips deeper children', () => {
    const blocks = [
      makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 }),
      makeBlock({ id: 2, type: 'bullet', ordered: true, level: 1 }),
      makeBlock({ id: 3, type: 'bullet', ordered: true, level: 0 })
    ]
    expect(orderedNumber(blocks, 2)).toBe(2) // skips the level-1 child
  })
})

describe('orderedLabel', () => {
  it('returns plain number at level 0', () => {
    const blocks = [makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 })]
    expect(orderedLabel(blocks, 0)).toBe('1')
  })

  it('returns hierarchical label for nested items', () => {
    const blocks = [
      makeBlock({ id: 1, type: 'bullet', ordered: true, level: 0 }),
      makeBlock({ id: 2, type: 'bullet', ordered: true, level: 1 }),
      makeBlock({ id: 3, type: 'bullet', ordered: true, level: 1 })
    ]
    expect(orderedLabel(blocks, 0)).toBe('1')
    expect(orderedLabel(blocks, 1)).toBe('1.1')
    expect(orderedLabel(blocks, 2)).toBe('1.2')
  })
})
