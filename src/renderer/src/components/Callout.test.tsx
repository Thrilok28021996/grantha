/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Callout } from './Callout'
import { CALLOUTS } from '../lib/callouts'
import type { Callout as CalloutData, CalloutKind } from '../lib/callouts'

const kind = (key: string): CalloutKind =>
  CALLOUTS.find((c) => c.key === key) ?? CALLOUTS[0]

const renderLine = (line: string, key: number) => <span key={key}>{line}</span>

describe('Callout', () => {
  it('renders the kind icon and title', () => {
    const data: CalloutData = {
      kind: kind('warning'),
      title: 'Be careful',
      body: '',
      foldable: false,
      startFolded: false
    }
    render(<Callout data={data} renderLine={renderLine} />)
    expect(screen.getByText('⚠')).toBeInTheDocument()
    expect(screen.getByText('Be careful')).toBeInTheDocument()
  })

  it('renders body lines', () => {
    const data: CalloutData = {
      kind: kind('note'),
      title: 'Note',
      body: 'Line one\nLine two',
      foldable: false,
      startFolded: false
    }
    render(<Callout data={data} renderLine={renderLine} />)
    expect(screen.getByText('Line one')).toBeInTheDocument()
    expect(screen.getByText('Line two')).toBeInTheDocument()
  })

  it('folds and unfolds when foldable', () => {
    const data: CalloutData = {
      kind: kind('tip'),
      title: 'Tip',
      body: 'Secret info',
      foldable: true,
      startFolded: false
    }
    render(<Callout data={data} renderLine={renderLine} />)
    // Initially open
    expect(screen.getByText('Secret info')).toBeInTheDocument()

    // Click to fold
    const head = screen.getByText('✦').closest('.bl-callout-head')!
    fireEvent.click(head)
    expect(screen.queryByText('Secret info')).not.toBeInTheDocument()

    // Click again to unfold
    fireEvent.click(head)
    expect(screen.getByText('Secret info')).toBeInTheDocument()
  })

  it('starts folded when startFolded is true', () => {
    const data: CalloutData = {
      kind: kind('info'),
      title: 'Info',
      body: 'Hidden',
      foldable: true,
      startFolded: true
    }
    render(<Callout data={data} renderLine={renderLine} />)
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('sets data-callout attribute for CSS styling', () => {
    const data: CalloutData = {
      kind: kind('danger'),
      title: 'Danger',
      body: '',
      foldable: false,
      startFolded: false
    }
    const { container } = render(<Callout data={data} renderLine={renderLine} />)
    expect(container.querySelector('[data-callout="danger"]')).toBeInTheDocument()
  })
})
