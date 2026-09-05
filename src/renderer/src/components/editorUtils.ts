import type { Block } from '../lib/blocks'

/**
 * The character offset within `root`'s text at viewport point (x, y), or null if it
 * can't be determined. Used so clicking a rendered block lands the caret where you
 * clicked (clicking past the text returns the end). Offsets are against the rendered
 * text, which matches the raw text for plain prose.
 */
export function caretOffsetAt(root: HTMLElement, x: number, y: number): number | null {
  const doc = root.ownerDocument as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  const range = doc.caretRangeFromPoint ? doc.caretRangeFromPoint(x, y) : null
  if (!range || !root.contains(range.startContainer)) return null
  let total = 0
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (node === range.startContainer) return total + range.startOffset
    total += (node.textContent ?? '').length
  }
  return null
}

/**
 * Whether the caret in a textarea sits on its first / last *visual* line, accounting for
 * soft word-wrap (not just literal `\n`). A long block that wraps over several display rows
 * should let ArrowUp/Down move between those rows and only jump to the adjacent block from
 * the true top/bottom row. Measured with a hidden mirror div that copies the textarea's
 * layout-affecting styles, so its wrapping matches.
 */
let caretMirror: HTMLDivElement | null = null
/** The style signature the mirror is currently configured for, so we only re-copy
 *  the ~20 computed properties when the textarea's geometry/typography actually
 *  differs — otherwise every ArrowUp/Down paid for a getComputedStyle read plus
 *  20 style writes (each invalidating layout) before measuring anything. */
let caretMirrorSig = ''
const CARET_MIRROR_PROPS = [
  'boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
  'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'tabSize'
] as const

export function caretLine(ta: HTMLTextAreaElement): { atFirst: boolean; atLast: boolean } {
  const cs = window.getComputedStyle(ta)
  // One persistent hidden mirror, reused across calls — creating/appending/removing a
  // div per ArrowUp/Down forces layout churn on every keypress.
  if (!caretMirror) {
    caretMirror = document.createElement('div')
    caretMirror.style.position = 'absolute'
    caretMirror.style.top = '-9999px'
    caretMirror.style.left = '-9999px'
    caretMirror.style.visibility = 'hidden'
    caretMirror.style.whiteSpace = 'pre-wrap'
    caretMirror.style.overflowWrap = 'break-word'
    document.body.appendChild(caretMirror)
    caretMirrorSig = ''
  }
  const div = caretMirror
  // Every row shares the editor's typography, so consecutive calls — even across
  // different blocks — almost always hit this early-out.
  // NUL separator: font-family and shorthand values contain spaces and commas,
  // so only a character CSS can never emit keeps the signature unambiguous.
  let sig = ''
  for (const p of CARET_MIRROR_PROPS) sig += cs[p as never] + '\u0000'
  if (sig !== caretMirrorSig) {
    for (const p of CARET_MIRROR_PROPS) div.style[p as never] = cs[p as never]
    caretMirrorSig = sig
  }
  // The top of the line containing `index` = offsetTop of a span placed at that index.
  const topAt = (index: number): number => {
    div.textContent = ta.value.slice(0, index)
    const span = document.createElement('span')
    span.textContent = ta.value.slice(index) || '.'
    div.appendChild(span)
    const top = span.offsetTop
    div.removeChild(span)
    return top
  }
  const cur = topAt(ta.selectionStart)
  const result = { atFirst: cur - topAt(0) < 2, atLast: topAt(ta.value.length) - cur < 2 }
  div.textContent = ''
  return result
}

/**
 * The 1-based number to display for an ordered-list item: its position within the current
 * run of same-level ordered siblings. Deeper children are skipped; a shallower level or a
 * non-ordered sibling at the same level ends the run (so each contiguous `1.`-list restarts).
 */
export function orderedNumber(blocks: Block[], index: number): number {
  const level = blocks[index].level
  let n = 1
  for (let i = index - 1; i >= 0; i--) {
    const p = blocks[i]
    if (p.level < level) break
    if (p.level === level) {
      if (p.type === 'bullet' && p.ordered) n++
      else break
    }
  }
  return n
}

/**
 * Hierarchical (legal-style) label for an ordered item: prefixes the numbers of its
 * ordered ancestors, e.g. `1`, `1.1`, `1.1.1`, `2`, `2.1`. Nesting under a non-ordered
 * bullet starts a fresh chain (no prefix), so only ordered ancestors contribute a segment.
 */
export function orderedLabel(blocks: Block[], index: number): string {
  const own = orderedNumber(blocks, index)
  const level = blocks[index].level
  if (level === 0) return String(own)
  let parent = -1
  for (let j = index - 1; j >= 0; j--) {
    if (blocks[j].level < level) {
      parent = j
      break
    }
  }
  if (parent >= 0 && blocks[parent].type === 'bullet' && blocks[parent].ordered) {
    return orderedLabel(blocks, parent) + '.' + own
  }
  return String(own)
}

/** A stable, pleasant background color for a tag's letter avatar (derived from its name). */
export function tagAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h}, 42%, 46%)`
}

/** Order-sensitive equality for two short string lists (alias sets). */
export function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
