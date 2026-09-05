import type { NoteFile, TemplateFile } from '@shared/types'

export type ViewMode =
  | 'editor'
  | 'graph'
  | 'database'
  | 'journal'
  | 'todos'
  | 'assets'
  | 'tags'
  | 'canvas'
  | 'tend'
export type ModalKind = 'settings' | 'help' | 'compile' | 'task' | null

/** One back/forward history step. A note opens the editor; a view step restores a
 *  non-editor screen (Bases/Graph/Tags/Canvas/…) so Back returns where you actually came from. */
export type HistEntry =
  | { kind: 'note'; path: string }
  | { kind: 'view'; view: ViewMode; baseId?: string | null; tag?: string | null; canvasPath?: string | null }

/** Selectable UI themes: cool dark (default), warm light ("paper"), and cool light. */
export type ThemeName = 'dark' | 'paper' | 'light'

export const EDITOR_FONTS: { key: string; label: string; stack: string }[] = [
  { key: 'sans', label: 'Sans', stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif" },
  { key: 'serif', label: 'Serif', stack: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif" },
  { key: 'mono', label: 'Mono', stack: 'var(--font-mono)' }
]
export const EDITOR_SIZES = [10, 12, 14, 15, 16, 18, 20]

/** One theme's worth of accent variables (`--accent` / `--accent-dim` / `--link`).
 *  `accentDim` doubles as the selection background (white text sits on it). */
export interface AccentVars {
  accent: string
  accentDim: string
  link: string
}

/** Selectable accent themes: CSS variable overrides applied on the root element.
 *  Each carries a dark and a light variant — a hue tuned for a dark canvas washes
 *  out on white, so App.tsx applies the one matching the active theme. */
export const ACCENTS: { key: string; label: string; dark: AccentVars; light: AccentVars }[] = [
  {
    key: 'indigo',
    label: 'Indigo',
    dark: { accent: '#7c8cff', accentDim: '#4a4f7a', link: '#8fa1ff' },
    light: { accent: '#4f5bd5', accentDim: '#5f6ad8', link: '#3d51cc' }
  },
  {
    key: 'teal',
    label: 'Teal',
    dark: { accent: '#2dd4bf', accentDim: '#1d5c54', link: '#5eead4' },
    light: { accent: '#0d9488', accentDim: '#12a496', link: '#0f766e' }
  },
  {
    key: 'green',
    label: 'Green',
    dark: { accent: '#4ade80', accentDim: '#276443', link: '#86efac' },
    light: { accent: '#16a34a', accentDim: '#1fad55', link: '#15803d' }
  },
  {
    key: 'amber',
    label: 'Amber',
    dark: { accent: '#f5a524', accentDim: '#6e4f1a', link: '#fbc75a' },
    light: { accent: '#d97706', accentDim: '#dd8514', link: '#b45309' }
  },
  {
    key: 'rose',
    label: 'Rose',
    dark: { accent: '#fb7185', accentDim: '#6e3540', link: '#fda4af' },
    light: { accent: '#e11d48', accentDim: '#e4325a', link: '#be123c' }
  },
  {
    key: 'mono',
    label: 'Mono',
    dark: { accent: '#a1a1aa', accentDim: '#4b4b52', link: '#c8c8d0' },
    light: { accent: '#52525b', accentDim: '#67676f', link: '#3f3f46' }
  }
]

/** Indent-guide style for the outliner. */
export type IndentGuides = 'off' | 'plain' | 'rainbow'

/** A side pane holds a cmd-clicked note or a PDF; any number can be open (splits). */
export interface SidePane {
  kind: 'note' | 'pdf'
  path: string
}

/** Selectable editor fonts (the note-writing area). */
/** Templates are simply the notes living under the `Templates/` folder. */
export function templatesFromFiles(files: NoteFile[]): TemplateFile[] {
  return files
    .filter((f) => f.path.startsWith('Templates/'))
    .map((f) => ({ path: f.path, name: f.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
