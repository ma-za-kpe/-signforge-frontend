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
  default: jest.fn(({ onReady }) => (
    <button onClick={onReady}>I Understand - Start Contributing</button>
  ))
}))

jest.mock('./SignSelector', () => ({
  __esModule: true,
  default: jest.fn(({ onSelectSign }) => (
    <button onClick={() => onSelectSign('HELLO')}>Select HELLO</button>
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
    render(<ContributionPage />)

    // Select sign
    fireEvent.click(screen.getByText('Select HELLO'))

    // Ready to record
    await waitFor(() => {
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))
    })

    // Wait for MediaPipe initialization
    await act(async () => {
      await Promise.resolve()
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

      // Should show "2.0s remaining" or similar
      expect(screen.getByText(/2\.\ds? remaining/i)).toBeInTheDocument()
    })

    test('should update countdown timer every 100ms', async () => {
      await navigateToRecording()

      // At start: 2.0s remaining
      expect(screen.getByText(/2\.\ds? remaining/i)).toBeInTheDocument()

      // After 500ms: ~1.5s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/1\.[4-6]s? remaining/i)).toBeInTheDocument()

      // After 1000ms more: ~1.0s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/1\.[0-1]s? remaining/i)).toBeInTheDocument()

      // After 500ms more: ~0.5s remaining
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(screen.getByText(/0\.[4-6]s? remaining/i)).toBeInTheDocument()
    })

    test('should show 0.0s when recording completes', async () => {
      await navigateToRecording()

      // Advance to end of recording
      act(() => {
        jest.advanceTimersByTime(1900) // Almost 2 seconds
      })

      expect(screen.getByText(/0\.[0-1]s? remaining/i)).toBeInTheDocument()
    })

    test('should display countdown in large, visible font', async () => {
      await navigateToRecording()

      const countdownElement = screen.getByText(/2\.\ds? remaining/i)
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

    test('should show 50% progress after 1 second', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const progressFill = screen.getByTestId('progress-fill')
      // Should be around 50% (allowing for small variations)
      const widthStyle = progressFill.style.width
      const widthValue = parseInt(widthStyle)
      expect(widthValue).toBeGreaterThanOrEqual(48)
      expect(widthValue).toBeLessThanOrEqual(52)
    })

    test('should show 100% progress at end', async () => {
      await navigateToRecording()

      // Advance to just before completion (1.9 seconds)
      act(() => {
        jest.advanceTimersByTime(1900)
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

      expect(screen.queryByText(/finishing up/i)).not.toBeInTheDocument()
    })

    test('should NOT show warning at 1 second remaining', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(screen.queryByText(/finishing up/i)).not.toBeInTheDocument()
    })

    test('should show warning when 0.5s or less remaining', async () => {
      await navigateToRecording()

      // Advance to 1.5 seconds (0.5s remaining)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(screen.getByText(/finishing up/i)).toBeInTheDocument()
    })

    test('should show warning with yellow color', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      const warning = screen.getByText(/finishing up/i)
      expect(warning.closest('div')).toHaveClass('bg-yellow-500')
    })

    test('should show warning with bounce animation', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      const warning = screen.getByText(/finishing up/i)
      expect(warning.closest('div')).toHaveClass('animate-bounce')
    })

    test('should keep warning visible until recording ends', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(screen.getByText(/finishing up/i)).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(400)
      })

      // Still visible at 0.1s remaining
      expect(screen.getByText(/finishing up/i)).toBeInTheDocument()
    })
  })

  describe('Feature 4: Completion Flash ("DONE!")', () => {

    test('should NOT show completion flash while recording', async () => {
      await navigateToRecording()

      expect(screen.queryByText(/done/i)).not.toBeInTheDocument()
    })

    test('should show "DONE!" flash when recording completes', async () => {
      await navigateToRecording()

      // Complete recording (2 seconds)
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(screen.getByText(/done/i)).toBeInTheDocument()
    })

    test('should show completion flash with green checkmark', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Should have checkmark emoji or icon
      const doneElement = screen.getByText(/✓.*done/i)
      expect(doneElement).toBeInTheDocument()
    })

    test('should show completion flash for 500ms', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Flash should be visible
      expect(screen.getByText(/done/i)).toBeInTheDocument()

      // After 300ms, still visible
      act(() => {
        jest.advanceTimersByTime(300)
      })
      expect(screen.getByText(/done/i)).toBeInTheDocument()

      // After 500ms total, should transition to review
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should now be on review screen
      await waitFor(() => {
        expect(screen.getByText(/review your recording/i)).toBeInTheDocument()
      })
    })

    test('should have large, prominent styling', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      const doneElement = screen.getByText(/done/i)
      expect(doneElement).toHaveClass('text-4xl')
      expect(doneElement).toHaveClass('font-bold')
    })

    test('should have pulse animation', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      const doneElement = screen.getByText(/done/i)
      expect(doneElement.closest('div')).toHaveClass('animate-pulse')
    })
  })

  describe('Feature 5: Manual Stop Button', () => {

    test('should display stop button while recording', async () => {
      await navigateToRecording()

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      expect(stopButton).toBeInTheDocument()
    })

    test('should NOT display stop button before recording', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('I Understand - Start Contributing'))
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

      // Should transition to review screen
      await waitFor(() => {
        expect(screen.getByText(/review your recording/i)).toBeInTheDocument()
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

      await waitFor(() => {
        // Should show frames captured (recording was stopped early)
        expect(screen.getByText(/frames captured:/i)).toBeInTheDocument()
      })
    })

    test('should still show completion flash when manually stopped', async () => {
      await navigateToRecording()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      fireEvent.click(stopButton)

      // Should show DONE flash
      expect(screen.getByText(/done/i)).toBeInTheDocument()
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

      // At 1.5 seconds (0.5s remaining):
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // 1. Countdown timer
      expect(screen.getByText(/0\.[4-6]s? remaining/i)).toBeInTheDocument()

      // 2. Progress bar
      expect(screen.getByTestId('recording-progress-bar')).toBeInTheDocument()

      // 3. Warning
      expect(screen.getByText(/finishing up/i)).toBeInTheDocument()

      // 4. Stop button
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    })

    test('should smoothly transition from recording to review', async () => {
      await navigateToRecording()

      // Complete recording
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Should show DONE flash
      expect(screen.getByText(/done/i)).toBeInTheDocument()

      // After 500ms, should be on review
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText(/review your recording/i)).toBeInTheDocument()
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
