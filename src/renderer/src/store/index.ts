// Barrel file — re-exports the store and all its types so existing
// `import { useStore } from '../store'` paths keep working.
export { useStore } from './state'
export {
  type ViewMode,
  type ModalKind,
  type HistEntry,
  type ThemeName,
  type IndentGuides,
  type SidePane,
  type AccentVars,
  EDITOR_FONTS,
  EDITOR_SIZES,
  ACCENTS,
  templatesFromFiles
} from './types'
