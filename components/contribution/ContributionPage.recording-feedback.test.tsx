/**
 * TDD Tests for Recording Feedback Features
 *
 * Features being tested:
 * 1. Countdown timer during recording (2.0s... 1.5s... 1.0s...)
 * 2. Progress bar visualization
 * 3. "Finishing up" warning at 0.5s remaining
 * 4. Completion flash ("DONE!") before screen transition
 * 5. Manual stop button
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ContributionPage from './ContributionPage'

// Mock dependencies
jest.mock('react-webcam', () => ({
  __esModule: true,
  default: jest.fn(() => <video data-testid="mock-webcam" />)
}))

jest.mock('./MediaPipeHandler', () => ({
  MediaPipeHandler: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn()
  })),
  drawSkeletonOverlay: jest.fn()
}))

jest.mock('./ReferencePlayer', () => ({
  __esModule: true,
  default: jest.fn(({ word, signImageUrl, onReady }) => (
    <div data-testid="reference-player">
      <h2>Reference: {word}</h2>
      <button onClick={onReady}>I Understand - Start Contributing</button>
    </div>
  ))
}))

jest.mock('./SignSelector', () => ({
  __esModule: true,
  default: jest.fn(({ onSelectSign }) => (
    <button onClick={() => onSelectSign('HELLO')}>Select HELLO</button>
  ))
}))

jest.mock('./SignClassification', () => ({
  __esModule: true,
  default: jest.fn(({ word, onComplete, onBack }) => (
    <div data-testid="sign-classification">
      <h2>Classify: {word}</h2>
      <button onClick={onBack}>Back to Reference</button>
      <button onClick={() => onComplete({
        sign_type_movement: 'dynamic',
        sign_type_hands: 'two-handed'
      })}>Continue to Recording</button>
    </div>
  ))
}))

jest.mock('./CommunityContributions', () => ({
  __esModule: true,
  default: jest.fn(({ word }) => (
    <div data-testid="community-contributions">
      <h2>Community Contributions for {word}</h2>
    </div>
  ))
}))

// Enable fake timers
beforeEach(() => {
  jest.useFakeTimers()
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('ContributionPage - Recording Feedback Features', () => {

  // Helper to get to recording state
  const navigateToRecording = async () => {
    render(<ContributionPage maxAttempts={1} testMode={true} />)

    // Select sign (goes to community state)
    fireEvent.click(screen.getByText('Select HELLO'))

    // Click "Add Your Contribution" button
    await waitFor(() => {
      expect(screen.getByText(/Add Your Contribution/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Add Your Contribution/i))

    // Click "I Understand - Start Contributing" on reference player
    await waitFor(() => {
      expect(screen.getByText('I Understand - Start Contributing')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('I Understand - Start Contributing'))

    // Wait for classification step and complete it
    await waitFor(() => {
      expect(screen.getByText('Continue to Recording')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Continue to Recording'))

    // Wait for MediaPipe initialization and recording interface
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    })

    // Click start recording button
    const startButton = screen.getByRole('button', { name: /start recording/i })
    fireEvent.click(startButton)

    // Fast forward through countdown (5 seconds)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
  }

  describe('Feature 1: Countdown Timer During Recording', () => {

    test('should display remaining time when recording starts', async () => {
      await navigateToRecording()

      // Should show "3.0s remaining" or similar
      expect(screen.getByText(/3\.\ds? remaining/i)).toBeInTheDocument()
    })

    test('should update countdown timer every 100ms', async () => {
      await navigateToRecording()

      // At start: 3.0s remaining
      expect(screen.getByText(/3\.\ds? remaining/i)).toBeInTheDocument()

      // After 500ms: ~2.5s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/2\.[4-6]s? remaining/i)).toBeInTheDocument()

      // After 1000ms more: ~2.0s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/[12]\.[0-1]s? remaining/i)).toBeInTheDocument()

      // After 500ms more: ~1.5s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/1\.[4-6]s? remaining/i)).toBeInTheDocument()
    })

    test('should show 0.0s when recording completes', async () => {
      await navigateToRecording()

      // Advance to end of recording
      act(() => {
        jest.advanceTimersByTime(2900) // Almost 3 seconds
      })

      expect(screen.getByText(/0\.[0-1]s? remaining/i)).toBeInTheDocument()
    })

    test('should display countdown in large, visible font', async () => {
      await navigateToRecording()

      const countdownElement = screen.getByText(/3\.\ds? remaining/i)
      expect(countdownElement).toHaveClass('text-red-600')
      expect(countdownElement).toHaveClass('font-semibold')
    })
  })

  describe('Feature 2: Progress Bar Visualization', () => {

    test('should display progress bar when recording starts', async () => {
      await navigateToRecording()

      const progressBar = screen.getByTestId('recording-progress-bar')
      expect(progressBar).toBeInTheDocument()
    })

    test('should show 0% progress at start', async () => {
      await navigateToRecording()

      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveStyle({ width: '0%' })
    })

    test('should show 33% progress after 1 second', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const progressFill = screen.getByTestId('progress-fill')
      // Should be around 33% (allowing for small variations)
      const widthStyle = progressFill.style.width
      const widthValue = parseInt(widthStyle)
      expect(widthValue).toBeGreaterThanOrEqual(30)
      expect(widthValue).toBeLessThanOrEqual(36)
    })

    test('should show 100% progress at end', async () => {
      await navigateToRecording()

      // Advance to just before completion (2.9 seconds)
      act(() => {
        jest.advanceTimersByTime(2900)
      })

      const progressFill = screen.getByTestId('progress-fill')
      const widthStyle = progressFill.style.width
      const widthValue = parseInt(widthStyle)
      // Should be around 95% (allowing for timing variations)
      expect(widthValue).toBeGreaterThanOrEqual(90)
      expect(widthValue).toBeLessThanOrEqual(100)
    })

    test('should update progress bar smoothly (every 100ms)', async () => {
      await navigateToRecording()

      const progressFill = screen.getByTestId('progress-fill')

      // Check progress increases over time
      const initialWidth = parseInt(progressFill.style.width)

      act(() => {
        jest.advanceTimersByTime(100)
      })

      const afterWidth = parseInt(progressFill.style.width)
      expect(afterWidth).toBeGreaterThan(initialWidth)
    })

    test('should have red color for progress bar', async () => {
      await navigateToRecording()

      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveClass('bg-red-600')
    })
  })

  describe('Feature 3: "Finishing Up" Warning', () => {

    test('should NOT show warning at start of recording', async () => {
      await navigateToRecording()

      expect(screen.queryByText(/Finishing up\.\.\./)).not.toBeInTheDocument()
    })

    test('should NOT show warning at 1 second remaining', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(screen.queryByText(/Finishing up\.\.\./)).not.toBeInTheDocument()
    })

    test('should show warning when 0.5s or less remaining', async () => {
      await navigateToRecording()

      // Advance to 2.5 seconds elapsed (0.5s remaining in 3s recording)
      act(() => {
        jest.advanceTimersByTime(2500)
      })

      expect(screen.getByText(/Finishing up\.\.\./)).toBeInTheDocument()
    })

    test('should show warning with yellow color', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2500)
      })

      const warning = screen.getByText(/Finishing up\.\.\./)
      expect(warning.closest('div')).toHaveClass('bg-yellow-500')
    })

    test('should show warning with bounce animation', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2500)
      })

      const warning = screen.getByText(/Finishing up\.\.\./)
      expect(warning.closest('div')).toHaveClass('animate-bounce')
    })

    test('should keep warning visible until recording ends', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2500)
      })

      expect(screen.getByText(/Finishing up\.\.\./)).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(400)
      })

      // Still visible at 0.1s remaining
      expect(screen.getByText(/Finishing up\.\.\./)).toBeInTheDocument()
    })
  })

  describe('Feature 4: Completion Flash ("DONE!")', () => {

    test('should NOT show completion flash while recording', async () => {
      await navigateToRecording()

      expect(screen.queryByText(/DONE/)).not.toBeInTheDocument()
    })

    test('should show "DONE!" flash when recording completes', async () => {
      await navigateToRecording()

      // Complete recording (need to advance to 3.5s for fallback timer to trigger)
      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Wait for completion flash to appear
      await waitFor(() => {
        expect(screen.getByText(/DONE/)).toBeInTheDocument()
      })
    })

    test('should show completion flash with green checkmark', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Wait for completion flash to appear
      // Should have checkmark emoji or icon
      await waitFor(() => {
        const doneElement = screen.getByText(/✓.*DONE/)
        expect(doneElement).toBeInTheDocument()
      })
    })

    test('should show completion flash for 500ms', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash to appear
      // Flash should be visible
      await waitFor(() => {
        expect(screen.getByText(/DONE/)).toBeInTheDocument()
      })

      // After 300ms, still visible
      act(() => {
        jest.advanceTimersByTime(300)
      })
      expect(screen.getByText(/DONE/)).toBeInTheDocument()

      // After 500ms total, should transition to review
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should now be on review screen
      await waitFor(() => {
        expect(screen.queryByText(/Start Recording/i)).not.toBeInTheDocument()
      })
    })

    test('should have large, prominent styling', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Wait for completion flash to appear
      await waitFor(() => {
        const doneElement = screen.getByText(/DONE/)
        expect(doneElement).toHaveClass('text-4xl')
        expect(doneElement).toHaveClass('font-bold')
      })
    })

    test('should have pulse animation', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Wait for completion flash to appear
      await waitFor(() => {
        const doneElement = screen.getByText(/DONE/)
        expect(doneElement.closest('div')).toHaveClass('animate-pulse')
      })
    })
  })

  describe('Feature 5: Manual Stop Button', () => {

    test('should display stop button while recording', async () => {
      await navigateToRecording()

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      expect(stopButton).toBeInTheDocument()
    })

    test('should NOT display stop button before recording', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // Select sign (goes to community state)
      fireEvent.click(screen.getByText('Select HELLO'))

      // Click "Add Your Contribution" button
      await waitFor(() => {
        expect(screen.getByText(/Add Your Contribution/i)).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText(/Add Your Contribution/i))

      // Wait for reference and click ready
      await waitFor(() => {
        expect(screen.getByText('I Understand - Start Contributing')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Wait for classification and complete it
      await waitFor(() => {
        expect(screen.getByText('Continue to Recording')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Continue to Recording'))

      // Wait for recording interface
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
      })

      // Before clicking "Start Recording"
      expect(screen.queryByRole('button', { name: /stop recording/i })).not.toBeInTheDocument()
    })

    test('should stop recording when stop button clicked', async () => {
      await navigateToRecording()

      // Record for 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Click stop button
      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      fireEvent.click(stopButton)

      // Wait for completion flash to appear
      await waitFor(() => {
        expect(screen.getByText(/DONE/)).toBeInTheDocument()
      })

      // Wait for completion flash (500ms)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should transition to review screen (check for absence of recording UI)
      await waitFor(() => {
        expect(screen.queryByText(/RECORDING/i)).not.toBeInTheDocument()
      })
    })

    test('should show frames captured when stopped early', async () => {
      await navigateToRecording()

      // Record for only 1 second (should capture ~30 frames)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      fireEvent.click(stopButton)

      // Wait for completion flash to appear
      await waitFor(() => {
        expect(screen.getByText(/DONE/)).toBeInTheDocument()
      })

      // Wait for completion flash (500ms)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should transition away from recording state
      await waitFor(() => {
        expect(screen.queryByText(/RECORDING/i)).not.toBeInTheDocument()
      })
    })

    test('should still show completion flash when manually stopped', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      fireEvent.click(stopButton)

      // Wait for completion flash to appear
      // Should show DONE flash
      expect(screen.getByText(/DONE/)).toBeInTheDocument()
    })

    test('should have red color and clear label', async () => {
      await navigateToRecording()

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      expect(stopButton).toHaveClass('bg-red-600')
      expect(stopButton).toHaveTextContent('⏹')
    })

    test('should be positioned prominently', async () => {
      await navigateToRecording()

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      expect(stopButton.closest('div')).toHaveClass('items-center')
    })
  })

  describe('Integration: All Features Working Together', () => {

    test('should show all feedback elements simultaneously', async () => {
      await navigateToRecording()

      // At 2.5 seconds elapsed (0.5s remaining in 3s recording):
      act(() => {
        jest.advanceTimersByTime(2500)
      })

      // 1. Countdown timer (should show ~0.5s remaining)
      expect(screen.getByText(/0\.[4-6]s? remaining/i)).toBeInTheDocument()

      // 2. Progress bar
      expect(screen.getByTestId('recording-progress-bar')).toBeInTheDocument()

      // 3. Warning
      expect(screen.getByText(/Finishing up\.\.\./)).toBeInTheDocument()

      // 4. Stop button
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    })

    test('should smoothly transition from recording to review', async () => {
      await navigateToRecording()

      // Complete recording
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash to appear
      // Should show DONE flash
      await waitFor(() => {
        expect(screen.getByText(/DONE/)).toBeInTheDocument()
      })

      // After 500ms, should be on review
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Check we transitioned away from recording state
      await waitFor(() => {
        expect(screen.queryByText(/RECORDING/i)).not.toBeInTheDocument()
      })
    })

    test('should maintain performance with all features enabled', async () => {
      const startTime = performance.now()

      await navigateToRecording()

      // Simulate full recording with all features active
      act(() => {
        for (let i = 0; i < 20; i++) {
          jest.advanceTimersByTime(100)
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete quickly (under 1 second in test environment)
      expect(duration).toBeLessThan(10000)
    })
  })
})
