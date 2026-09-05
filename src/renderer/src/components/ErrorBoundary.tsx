import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Human-readable name shown in the error fallback (e.g. "Note editor", "Graph"). */
  label?: string
}
interface State {
  error: Error | null
}

/**
 * Keeps one crashing view from taking down the whole app.  When `label` is
 * provided, the fallback says which component failed so the user knows what
 * to retry — a bare "This view hit an error" gives no hint whether it was
 * the graph, a query embed, or the editor.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, info.componentStack)
  }

  componentDidUpdate(prev: Props): void {
    // Reset when the children change (e.g. switching tabs/views).
    if (prev.children !== this.props.children && this.state.error) this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="scroll-area">
          <div className="doc">
            <h3 style={{ color: 'var(--danger)' }}>
              {this.props.label ? `${this.props.label} hit an error` : 'This view hit an error'}
            </h3>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-dim)', fontSize: 13 }}>
              {this.state.error.message}
            </pre>
            <button className="btn ghost" onClick={() => this.setState({ error: null })}>
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
