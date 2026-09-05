/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ErrorBoundary } from './ErrorBoundary'
import { type ReactNode } from 'react'

/** A component that throws on render. */
function Boom({ message = 'boom' }: { message?: string }): ReactNode {
  throw new Error(message)
}

/** Suppress React's expected console.error noise from the boundary catching. */
const silence = vi.spyOn(console, 'error').mockImplementation(() => {})

afterAll(() => silence.mockRestore())

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <div>hello</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('catches a render error and shows the fallback', () => {
    render(
      <ErrorBoundary>
        <Boom message="test crash" />
      </ErrorBoundary>
    )
    expect(screen.getByText(/hit an error/)).toBeInTheDocument()
    expect(screen.getByText('test crash')).toBeInTheDocument()
  })

  it('shows the label in the fallback heading', () => {
    render(
      <ErrorBoundary label="Note editor">
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('Note editor hit an error')).toBeInTheDocument()
  })

  it('resets on Retry click', () => {
    // A component that crashes only on the first render, then recovers.
    let shouldThrow = true
    function Flaky(): ReactNode {
      if (shouldThrow) throw new Error('flaky')
      return <div>recovered</div>
    }

    render(
      <ErrorBoundary label="Test">
        <Flaky />
      </ErrorBoundary>
    )
    expect(screen.getByText('Test hit an error')).toBeInTheDocument()

    // Fix the component before clicking retry
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    // After retry, the boundary clears its error state and re-renders children
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('resets when children change (e.g. switching notes)', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Boom message="old note" />
      </ErrorBoundary>
    )
    expect(screen.getByText('old note')).toBeInTheDocument()

    // Switch to a different child — the boundary should reset
    rerender(
      <ErrorBoundary>
        <div>new note</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('new note')).toBeInTheDocument()
  })
})
