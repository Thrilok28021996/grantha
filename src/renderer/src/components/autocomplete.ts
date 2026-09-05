import type { NoteFile } from '@shared/types'
import type { VaultIndex } from '../lib/vault'
import { dirname, stripMd } from '../lib/links'
import { dateSuggestions, formatLong } from '../lib/dates'
import {
  buildSupertagIndex,
  normTag,
  resolveFields,
  supertagsFromParsed,
  type Supertag
} from '../lib/supertags'
import type { ParsedNote } from '@shared/types'
import type { AcSuggestion } from './BlockRow'

/** Commands offered by the `/` menu. */
export const SLASH_COMMANDS: { cmd: string; label: string; icon: string }[] = [
  { cmd: 'template', label: 'Insert template', icon: '▤' },
  { cmd: 'h1', label: 'Heading 1', icon: 'H1' },
  { cmd: 'h2', label: 'Heading 2', icon: 'H2' },
  { cmd: 'h3', label: 'Heading 3', icon: 'H3' },
  { cmd: 'todo', label: 'To-do', icon: '☐' },
  { cmd: 'bullet', label: 'Bullet list', icon: '•' },
  { cmd: 'numbered', label: 'Numbered list', icon: '1.' },
  { cmd: 'table', label: 'Table', icon: '▦' },
  { cmd: 'quote', label: 'Quote', icon: '❝' },
  { cmd: 'callout', label: 'Callout', icon: '⚑' },
  { cmd: 'math', label: 'Math block', icon: '∑' },
  { cmd: 'mermaid', label: 'Mermaid diagram', icon: '◇' },
  { cmd: 'query', label: 'Query — find notes or lines…', icon: '⌕' },
  { cmd: 'base', label: 'Embed a saved Base view', icon: '▦' },
  { cmd: 'embed', label: 'Embed a note — ![[Note]]', icon: '❐' }
]

/** Typing one of these while text is selected wraps the selection instead of replacing it. */
export const WRAP_PAIRS: Record<string, string> = { '[': ']', '(': ')', '{': '}', '"': '"', "'": "'", '`': '`' }

/** State of the autocomplete popup under a block. */
export interface AcState {
  id: number
  query: string
  index: number
  kind: 'link' | 'tag' | 'slash-menu' | 'slash-template'
}

/**
 * Build the autocomplete suggestion list for the current popup state.
 * Pure function — no React state, no side effects.
 */
export function buildAcItems(
  state: AcState,
  files: NoteFile[],
  templates: { path: string; name: string }[],
  parsed: Record<string, ParsedNote>,
  index: VaultIndex,
  supertagIndex: Map<string, Supertag>
): AcSuggestion[] {
  const q = state.query.toLowerCase()
  if (state.kind === 'slash-menu') {
    // Match the COMMAND as well as its label: what you type after `/` is the
    // command name, and a label that reads well rarely contains it verbatim
    // (`/todo` never matched "To-do"; `/query` stopped matching once its label
    // was reworded).
    return SLASH_COMMANDS.filter(
      (c) => c.cmd.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    ).map((c) => ({
      key: c.cmd,
      label: c.label,
      icon: c.icon,
      cmd: c.cmd
    }))
  }
  if (state.kind === 'slash-template') {
    const list = templates
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((t) => ({ key: t.path, label: t.name, icon: '▤', tplPath: t.path }))
    return list.length ? list : [{ key: '__none__', label: 'No templates — add .md files to Templates/', icon: '▤' }]
  }
  if (state.kind === 'tag') {
    // Supertags first (typed tags — completing one applies its field schema),
    // then the vault's plain tags.
    const stHits: AcSuggestion[] = [...supertagIndex.values()]
      .filter((st) => st.tag.includes(q) || st.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 6)
      .map((st) => {
        const n = resolveFields(st.tag, supertagIndex).length
        return {
          key: `st:${st.tag}`,
          label: st.name,
          icon: '▤',
          sub: n === 1 ? '1 field' : `${n} fields`,
          tag: st.name
        }
      })
    const plain = new Set<string>()
    for (const note of Object.values(parsed)) {
      for (const t of note.tags) if (!supertagIndex.has(normTag(t))) plain.add(t)
    }
    const tagHits: AcSuggestion[] = [...plain]
      .filter((t) => t.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8)
      .map((t) => ({ key: `tag:${t}`, label: t, icon: '#', tag: t }))
    const rows = [...stHits, ...tagHits].slice(0, 9)
    // Offer to mint a definition note for the typed name. The row does two jobs —
    // create a brand-new tag, or give an existing plain tag its first schema — so
    // label it for whichever it actually is ("New tag" on a tag you already use
    // reads as a mistake).
    const name = state.query.trim()
    if (name && !supertagIndex.has(normTag(name))) {
      const known = [...plain].some((t) => normTag(t) === normTag(name))
      rows.push({
        key: '__new_st__',
        label: known ? `Add a schema to "${name}"` : `New tag "${name}"`,
        icon: '＋',
        createTag: name
      })
    }
    return rows
  }
  // Natural-language dates first: `[[tomo`, `[[next friday`, `[[3 days ago` →
  // the resolved daily note (inserting the ISO name, which navigates as a
  // journal day whether or not the note exists yet).
  const dateHits: AcSuggestion[] = dateSuggestions(state.query).map((d) => ({
    key: `date:${d.iso}`,
    label: d.label,
    icon: '☼',
    sub: `${formatLong(d.iso)} — daily note`,
    insert: d.iso
  }))
  const nameCounts = new Map<string, number>()
  for (const f of files) nameCounts.set(f.name.toLowerCase(), (nameCounts.get(f.name.toLowerCase()) ?? 0) + 1)
  const fileHits = files
    .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
    .slice(0, 8)
    .map((f) => {
      const ambiguous = (nameCounts.get(f.name.toLowerCase()) ?? 0) > 1
      return {
        key: f.path,
        label: f.name,
        icon: '[[ ]]',
        sub: dirname(f.path),
        excerpt: parsed[f.path]?.excerpt,
        insert: ambiguous ? stripMd(f.path) : f.name
      }
    })
  // Frontmatter aliases that match — inserting the alias links via the alias index.
  const aliasHits: AcSuggestion[] = index
    .aliasList()
    .filter((a) => a.alias.toLowerCase().includes(q))
    .slice(0, 4)
    .map((a) => ({ key: `alias:${a.alias}`, label: a.alias, icon: '[[ ]]', sub: `→ ${a.name}`, insert: a.alias }))
  return [...dateHits, ...fileHits, ...aliasHits].slice(0, 10)
}

/** Build a SupertagIndex from parsed notes. */
export function buildSupertagMap(parsed: Record<string, ParsedNote>): Map<string, Supertag> {
  return buildSupertagIndex(supertagsFromParsed(parsed))
}
