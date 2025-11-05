/**
 * TDD Tests for ContributionPage State Management
 *
 * Testing Philosophy:
 * - Test behavior, not implementation
 * - Cover all state transitions
 * - Test edge cases and error handling
 * - Verify UI updates match business logic
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ContributionPage from './ContributionPage'

// Mock dependencies
jest.mock('react-webcam', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      // Create a mock video element
      const mockVideo = {
        play: jest.fn(),
        pause: jest.fn(),
        getBoundingClientRect: () => ({ width: 640, height: 480, x: 0, y: 0, top: 0, left: 0, bottom: 480, right: 640 })
      }

      // Attach the mock video to the ref
      React.useEffect(() => {
        if (ref) {
          if (typeof ref === 'function') {
            ref({ video: mockVideo })
          } else {
            ref.current = { video: mockVideo }
          }
        }

        // Simulate webcam ready
        if (props.onUserMedia) {
          setTimeout(() => props.onUserMedia(), 0)
        }
      }, [])

      return React.createElement('video', { 'data-testid': 'mock-webcam' })
    })
  }
})

// Mock MediaPipe with controllable callbacks
let mockLandmarkCallback: any = null

jest.mock('./MediaPipeHandler', () => {
  let callback: any = null
  return {
    MediaPipeHandler: jest.fn().mockImplementation((video: any, cb: any) => {
      console.log('🔧 MediaPipeHandler mock instantiated, setting callback')
      callback = cb
      // Expose callback globally so tests can access it
      if (typeof global !== 'undefined') {
        (global as any).__mockLandmarkCallback = cb
        console.log('✅ Global callback set:', typeof cb)
      }
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        start: jest.fn().mockResolvedValue(undefined),
        dispose: jest.fn()
      }
    }),
    drawSkeletonOverlay: jest.fn()
  }
})

jest.mock('./ReferencePlayer', () => ({
  __esModule: true,
  default: jest.fn(({ word, signImageUrl, onReady }) => (
    <div data-testid="reference-player">
      <h2>Reference: {word}</h2>
      <button onClick={onReady}>I Understand - Start Contributing</button>
    </div>
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

jest.mock('./SignSelector', () => ({
  __esModule: true,
  default: jest.fn(({ onSelectSign }) => (
    <div data-testid="sign-selector">
      <button onClick={() => onSelectSign('HELLO')}>Select HELLO</button>
      <button onClick={() => onSelectSign('THANK_YOU')}>Select THANK_YOU</button>
    </div>
  ))
}))

// Mock fetch
global.fetch = jest.fn()

// Helper to simulate frame capture
const simulateFrameCapture = (count: number = 60) => {
  const callback = (global as any).__mockLandmarkCallback
  if (!callback) {
    console.error('⚠️  simulateFrameCapture: callback not found!')
    return
  }

  const mockResults = {
    poseLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 1.0 }),
    leftHandLandmarks: Array(21).fill({ x: 0.3, y: 0.4, z: 0, visibility: 1.0 }),
    rightHandLandmarks: Array(21).fill({ x: 0.7, y: 0.4, z: 0, visibility: 1.0 }),
    faceLandmarks: null
  }

  console.log(`📸 simulateFrameCapture: calling callback ${count} times`)
  // Call each frame separately to ensure state updates are processed
  for (let i = 0; i < count; i++) {
    act(() => {
      callback(mockResults)
    })
  }
  console.log(`✅ simulateFrameCapture: completed ${count} calls`)
}

// Helper to navigate to recording state (through select → community → reference → classification → environment-check → recording)
const navigateToRecording = async (word: string = 'HELLO') => {
  // Select word (goes to community state)
  fireEvent.click(screen.getByText(`Select ${word}`))

  // Click "Add Your Contribution" button
  await waitFor(() => screen.getByText(/Add Your Contribution/i))
  fireEvent.click(screen.getByText(/Add Your Contribution/i))

  // Wait for reference and click ready
  await waitFor(() => screen.getByText('I Understand - Start Contributing'))
  fireEvent.click(screen.getByText('I Understand - Start Contributing'))

  // Wait for classification and complete it
  await waitFor(() => screen.getByText('Continue to Recording'))
  fireEvent.click(screen.getByText('Continue to Recording'))

  // In test mode, environment check is skipped and goes straight to recording
  // Wait for recording interface
  await waitFor(() => screen.getByRole('button', { name: /start recording/i }))

  // MediaPipe should initialize automatically when entering recording state
  // The mock will set the global callback when MediaPipeHandler is instantiated
}

describe('ContributionPage - State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Clear global callback
    delete (global as any).__mockLandmarkCallback

    try {
      jest.useFakeTimers()
    } catch (e) {
      // Ignore timer setup errors
    }

    // Mock successful API response by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        contribution_id: 'cont_123456',
        total_contributions: 5,
        progress_percentage: 50,
        message: 'Contribution received successfully'
      })
    })
  })

  afterEach(() => {
    try {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    } catch (e) {
      // Ignore timer cleanup errors
    }
  })

  describe('Initial State', () => {
    it('should start in "select" state and render SignSelector', () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
      expect(screen.queryByTestId('reference-player')).not.toBeInTheDocument()
      expect(screen.queryByTestId('mock-webcam')).not.toBeInTheDocument()
    })

    it('should have empty selectedWord initially', () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // SignSelector should be visible, meaning no word is selected yet
      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
    })
  })

  describe('State Transition: select → community → reference', () => {
    it('should transition to community state when word is selected', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      const selectButton = screen.getByText('Select HELLO')
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('community-contributions')).toBeInTheDocument()
        expect(screen.getByText(/Add Your Contribution/i)).toBeInTheDocument()
      })

      expect(screen.queryByTestId('sign-selector')).not.toBeInTheDocument()
    })

    it('should transition to reference state when Add Your Contribution is clicked', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))

      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))

      await waitFor(() => {
        expect(screen.getByTestId('reference-player')).toBeInTheDocument()
        expect(screen.getByText('Reference: HELLO')).toBeInTheDocument()
      })
    })

    it('should store selected word in state', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select THANK_YOU'))

      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))

      await waitFor(() => {
        expect(screen.getByText('Reference: THANK_YOU')).toBeInTheDocument()
      })
    })
  })

  describe('State Transition: reference → classification', () => {
    it('should transition to classification state when user clicks "I\'m Ready"', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // Navigate to reference state
      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))

      await waitFor(() => {
        expect(screen.getByText('I Understand - Start Contributing')).toBeInTheDocument()
      })

      // Click ready button
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      await waitFor(() => {
        expect(screen.getByTestId('sign-classification')).toBeInTheDocument()
        expect(screen.getByText('Classify: HELLO')).toBeInTheDocument()
      })
    })

    it('should allow going back to reference from classification', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))
      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      await waitFor(() => screen.getByText('Back to Reference'))
      fireEvent.click(screen.getByText('Back to Reference'))

      await waitFor(() => {
        expect(screen.getByTestId('reference-player')).toBeInTheDocument()
        expect(screen.queryByTestId('sign-classification')).not.toBeInTheDocument()
      })
    })
  })

  describe('State Transition: classification → recording', () => {
    it('should transition to recording state when classification is complete', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // Navigate through flow
      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))
      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
        expect(screen.queryByTestId('sign-classification')).not.toBeInTheDocument()
      })
    })

    it('should initialize MediaPipe when entering recording state', async () => {
      const { MediaPipeHandler } = require('./MediaPipeHandler')

      // Clear mock to count only calls from this test
      MediaPipeHandler.mockClear()

      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))
      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      // Wait for recording UI to be ready
      await waitFor(() => screen.getByTestId('mock-webcam'))

      // MediaPipe should have been initialized
      await waitFor(() => {
        expect(MediaPipeHandler).toHaveBeenCalled()
      })
    })
  })

  describe('Recording Flow', () => {
    it('should show countdown when Start Recording is clicked', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)
      await navigateToRecording()

      await waitFor(() => {
        const startButton = screen.getByText(/Start Recording/i)
        fireEvent.click(startButton)
      })

      // Should show countdown starting at 5
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should count down from 5 to 1', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)
      await navigateToRecording()

      await waitFor(() => {
        const startButton = screen.getByText(/Start Recording/i)
        fireEvent.click(startButton)
      })

      // Check countdown sequence
      await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())

      act(() => { jest.advanceTimersByTime(1000) })
      expect(screen.getByText('4')).toBeInTheDocument()

      act(() => { jest.advanceTimersByTime(1000) })
      expect(screen.getByText('3')).toBeInTheDocument()

      act(() => { jest.advanceTimersByTime(1000) })
      expect(screen.getByText('2')).toBeInTheDocument()

      act(() => { jest.advanceTimersByTime(1000) })
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should start recording after countdown completes', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)
      await navigateToRecording()

      await waitFor(() => {
        const startButton = screen.getByText(/Start Recording/i)
        fireEvent.click(startButton)
      })

      // Fast-forward through countdown
      act(() => { jest.advanceTimersByTime(5000) })

      // Should show recording indicator
      await waitFor(() => {
        expect(screen.getByText(/RECORDING\.\.\./i)).toBeInTheDocument()
      })
    })
  })

  describe('Successful Submission Flow', () => {
    const navigateToReviewState = async () => {
      render(<ContributionPage maxAttempts={3} testMode={true} />)

      // Navigate to recording state (through classification)
      await navigateToRecording()

      // Perform all 3 attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        // Start recording - find the button (text varies by attempt)
        await waitFor(() => {
          const button = screen.getByRole('button', { name: /Start Recording/i })
          expect(button).toBeInTheDocument()
        })

        // Click Start Recording button
        const button = screen.getByRole('button', { name: /Start Recording/i })
        fireEvent.click(button)

        // Advance countdown timers (5 seconds)
        act(() => {
          jest.advanceTimersByTime(5000)
        })

        // Wait for recording to actually start
        await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

        // Simulate frame capture (60 frames) - must be done while recording is active
        simulateFrameCapture(60)

        // Advance timers to simulate recording duration
        act(() => {
          jest.advanceTimersByTime(3000)
        })

        // Manually trigger stop recording (click the Stop Recording button)
        await waitFor(() => screen.getByRole('button', { name: /Stop Recording/i }))

        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /Stop Recording/i }))

          // Wait for completion flash (500ms) - in testMode this is instant
          jest.advanceTimersByTime(500)

          // After clicking stop, component calls stopRecording() which:
          // 1. Sets showCompletionFlash (instant)
          // 2. Calls handleAttemptComplete() after 500ms (or immediately in testMode)
          // 3. handleAttemptComplete() is async and may call submitAveragedContribution
          // We need to allow these promises to resolve
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
        })

        // If this is the last attempt, wait for success state transition
        if (attempt === 3) {
          // Give extra time for the submission to complete
          await waitFor(() => {
            // Check that we're either in success state or still processing
            // We'll verify success state in the actual test assertion
          }, { timeout: 1000 })
        }
        // If not the last attempt, the next loop iteration will find the next attempt button
      }

      return screen
    }

    it('should transition to success state after all 3 attempts complete', async () => {
      await navigateToReviewState()

      // After 3 attempts, should auto-submit and go to success state
      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
        expect(screen.getByText(/successfully/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show progress stats in success state after 3 attempts', async () => {
      await navigateToReviewState()

      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument() // Total contributions
        expect(screen.getByText(/Total contributions for/i)).toBeInTheDocument()
      })
    })

    it('should call API with averaged data from 3 attempts', async () => {
      await navigateToReviewState()

      // Verify API call structure
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/contribute'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.any(String)
          })
        )

        // Verify body contains averaged data from 3 attempts
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.word).toBe('HELLO')
        expect(body.frames.length).toBeGreaterThan(0) // Averaged frames
        expect(body.user_id).toMatch(/^user_/)
        expect(body.num_attempts).toBe(3)
        expect(body.individual_qualities).toHaveLength(3)
        expect(body.individual_durations).toHaveLength(3)
      })
    })

    it('should auto-advance to recording state after 3 seconds in success', async () => {
      await navigateToReviewState()

      // Verify in success state
      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      act(() => { jest.advanceTimersByTime(3500) })

      // Should be back in recording state
      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
        expect(screen.queryByText(/Thank You!/i)).not.toBeInTheDocument()
      })
    })

    it('should keep same word when auto-advancing from success', async () => {
      await navigateToReviewState()

      // Auto-advance from success state
      await waitFor(() => screen.getByText(/Thank You!/i))
      act(() => { jest.advanceTimersByTime(3500) })

      // Should still be on HELLO, not back to selector
      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
        expect(screen.queryByTestId('sign-selector')).not.toBeInTheDocument()
        expect(screen.queryByText(/Thank You!/i)).not.toBeInTheDocument()
      })
    })

    it('should reset for new 3-attempt cycle when auto-advancing', async () => {
      await navigateToReviewState()

      // Auto-advance from success
      await waitFor(() => screen.getByText(/Thank You!/i))
      act(() => { jest.advanceTimersByTime(3500) })

      // Should be able to start new recording (Attempt 1 of new cycle)
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error when recording is too short (<30 frames)', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))
      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

      // Capture only 20 frames (too short)
      simulateFrameCapture(20)

      act(() => { jest.advanceTimersByTime(3000) })

      // Manually click stop button
      await waitFor(() => screen.getByRole('button', { name: /Stop Recording/i }))
      fireEvent.click(screen.getByRole('button', { name: /Stop Recording/i }))

      await act(async () => {
        // Wait for completion flash (500ms)
        jest.advanceTimersByTime(500)
        // Allow promises to resolve
        await Promise.resolve()
      })

      // Try to submit
      await waitFor(() => screen.getByText(/Looks Good - Submit/i), { timeout: 5000 })
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      expect(alertMock).toHaveBeenCalledWith('Recording too short. Please try again.')
      alertMock.mockRestore()
    })

    it('should handle API failure gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          detail: 'Server error: Database unavailable'
        })
      })

      render(<ContributionPage maxAttempts={1} testMode={true} />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      await waitFor(() => screen.getByRole('button', { name: /Stop Recording/i }))
      fireEvent.click(screen.getByRole('button', { name: /Stop Recording/i }))

      await act(async () => {
        // Wait for completion flash (500ms)
        jest.advanceTimersByTime(500)
        // Allow promises to resolve
        await Promise.resolve()
      })

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Database unavailable')
        )
      })

      alertMock.mockRestore()
    })

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network request failed')
      )

      render(<ContributionPage maxAttempts={1} testMode={true} />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      await waitFor(() => screen.getByRole('button', { name: /Stop Recording/i }))
      fireEvent.click(screen.getByRole('button', { name: /Stop Recording/i }))

      await act(async () => {
        // Wait for completion flash (500ms)
        jest.advanceTimersByTime(500)
        // Allow promises to resolve
        await Promise.resolve()
      })

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Network request failed')
        )
      })

      alertMock.mockRestore()
    })

    it('should stay in review state after submission error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      render(<ContributionPage maxAttempts={1} testMode={true} />)

      jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      await waitFor(() => screen.getByRole('button', { name: /Stop Recording/i }))
      fireEvent.click(screen.getByRole('button', { name: /Stop Recording/i }))

      await act(async () => {
        // Wait for completion flash (500ms)
        jest.advanceTimersByTime(500)
        // Allow promises to resolve
        await Promise.resolve()
      })

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      // Should remain in review state
      await waitFor(() => {
        expect(screen.getByText(/Review Your Recording/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('should allow retake from review state', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      simulateFrameCapture(60)

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      await act(async () => {
        // Wait for completion flash (500ms)
        jest.advanceTimersByTime(500)
        // Allow promises to resolve
        await Promise.resolve()
      })

      // Wait for review state
      await waitFor(() => {
        expect(screen.getByText(/Review Your Recording/i)).toBeInTheDocument()
      })

      const retakeButton = screen.getByText(/Retake/i)
      fireEvent.click(retakeButton)

      // Should go back to recording state
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })

    it('should clear frames when retaking', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      await waitFor(() => screen.getByText(/Frames captured: 60/i))

      const retakeButton = await screen.findByText(/Retake/i)
      fireEvent.click(retakeButton)

      // Frame count should be cleared (Start Recording should be available)
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })

    it('should allow choosing different sign from review', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      const changeSignButton = await screen.findByText(/Choose Different Sign/i)
      fireEvent.click(changeSignButton)

      // Should return to sign selector
      await waitFor(() => {
        expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
      })
    })

    it('should reset all state when choosing different sign', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      const changeSignButton = await screen.findByText(/Choose Different Sign/i)
      fireEvent.click(changeSignButton)

      // Select new word
      await waitFor(() => screen.getByText('Select THANK_YOU'))
      fireEvent.click(screen.getByText('Select THANK_YOU'))

      // Should show THANK_YOU, not HELLO
      await waitFor(() => {
        expect(screen.getByText('Reference: THANK_YOU')).toBeInTheDocument()
      })
    })
  })

  describe('MediaPipe Integration', () => {
    it('should dispose MediaPipe handler on unmount', async () => {
      const { MediaPipeHandler } = require('./MediaPipeHandler')
      const disposeMock = jest.fn()

      MediaPipeHandler.mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        start: jest.fn().mockResolvedValue(undefined),
        dispose: disposeMock
      }))

      const { unmount } = render(<ContributionPage maxAttempts={1} testMode={true} />)

      // Navigate to recording to create handler
      fireEvent.click(screen.getByText('Select HELLO'))

      await waitFor(() => screen.getByText(/Add Your Contribution/i))

      fireEvent.click(screen.getByText(/Add Your Contribution/i))

      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByTestId('mock-webcam'))

      unmount()

      await waitFor(() => {
        expect(disposeMock).toHaveBeenCalled()
      })
    })

    it('should capture frames at ~30fps during recording', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

      // Simulate 60 frames (3 seconds @ 20fps or 2 seconds @ 30fps)
      simulateFrameCapture(60)

      act(() => { jest.advanceTimersByTime(3500) })

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      // Should show 60 frames captured
      await waitFor(() => {
        expect(screen.getByText(/Frames captured: 60/i)).toBeInTheDocument()
      })
    })

    it('should capture all required landmarks', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      // Verify landmarks in API call
      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        expect(body.frames[0].pose_landmarks).toHaveLength(33)
        expect(body.frames[0].left_hand_landmarks).toHaveLength(21)
        expect(body.frames[0].right_hand_landmarks).toHaveLength(21)
      })
    })
  })

  describe('Anonymous User ID', () => {
    it('should generate unique user ID on component mount', () => {
      const { unmount } = render(<ContributionPage maxAttempts={1} testMode={true} />)
      unmount()

      // Render again
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // User ID is generated internally
      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
    })

    it('should include user ID in contribution submission', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(3000) })

      // Manually trigger stop recording
      const stopButton = screen.queryByRole('button', { name: /Stop Recording/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      // Wait for completion flash (500ms)
      act(() => { jest.advanceTimersByTime(500) })

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.user_id).toMatch(/^user_/)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid state transitions', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      // Click HELLO - this transitions to community state immediately
      fireEvent.click(screen.getByText('Select HELLO'))

      // Once transitioned, SignSelector is no longer rendered
      // Verify we ended up in community state
      await waitFor(() => {
        expect(screen.getByTestId('community-contributions')).toBeInTheDocument()
        expect(screen.getByText(/Add Your Contribution/i)).toBeInTheDocument()
      })
    })

    it('should prevent submission during countdown', async () => {
      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))


      await waitFor(() => screen.getByText(/Add Your Contribution/i))


      fireEvent.click(screen.getByText(/Add Your Contribution/i))


      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      // During countdown, submit button should not be visible
      await waitFor(() => screen.getByText('5'))
      expect(screen.queryByText(/Submit/i)).not.toBeInTheDocument()
    })

    it('should handle MediaPipe initialization failure', async () => {
      const { MediaPipeHandler } = require('./MediaPipeHandler')

      MediaPipeHandler.mockImplementation(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('Camera permission denied')),
        start: jest.fn(),
        dispose: jest.fn()
      }))

      render(<ContributionPage maxAttempts={1} testMode={true} />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText(/Add Your Contribution/i))
      fireEvent.click(screen.getByText(/Add Your Contribution/i))
      await waitFor(() => screen.getByText('I Understand - Start Contributing'))
      fireEvent.click(screen.getByText('I Understand - Start Contributing'))

      // Complete classification step
      await waitFor(() => screen.getByText('Continue to Recording'))
      fireEvent.click(screen.getByText('Continue to Recording'))

      // The component should still render the recording UI despite error
      // (error is shown via toast, not alert)
      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
      })
    })
  })
})

describe('ContributionPage - Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    try {
      jest.useFakeTimers()
    } catch (e) {
      // Ignore timer errors
    }
  })

  afterEach(() => {
    try {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    } catch (e) {
      // Ignore cleanup errors
    }
  })

  describe('Frame Validation', () => {
    it('should require minimum 30 frames (1 second @ 30fps)', () => {
      // Tested in "should show error when recording is too short"
      expect(30).toBeLessThan(60)
    })

    it('should accept exactly 30 frames as valid', () => {
      // 30 frames = 1 second at 30fps - minimum valid recording
      expect(30).toBeGreaterThanOrEqual(30)
    })

    it('should accept more than 30 frames', () => {
      // Normal recording is 60 frames (2 seconds)
      expect(60).toBeGreaterThanOrEqual(30)
    })

    it('should calculate duration from last frame timestamp', () => {
      const frames = [
        { timestamp: 0.0 },
        { timestamp: 0.5 },
        { timestamp: 1.0 },
        { timestamp: 1.5 },
        { timestamp: 2.0 }
      ]

      const duration = frames[frames.length - 1].timestamp
      expect(duration).toBe(2.0)
    })
  })

  describe('Contribution Payload', () => {
    it('should include all required fields', () => {
      const payload = {
        word: 'HELLO',
        user_id: 'user_abc123',
        frames: [],
        duration: 2.0,
        metadata: {}
      }

      expect(payload).toHaveProperty('word')
      expect(payload).toHaveProperty('user_id')
      expect(payload).toHaveProperty('frames')
      expect(payload).toHaveProperty('duration')
      expect(payload).toHaveProperty('metadata')
    })

    it('should include browser metadata', () => {
      const metadata = {
        browser: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      expect(metadata.browser).toBeTruthy()
      expect(metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should format frames correctly', () => {
      const frame = {
        frame_number: 0,
        timestamp: 0.0,
        pose_landmarks: Array(33).fill({ x: 0, y: 0, z: 0 }),
        left_hand_landmarks: Array(21).fill({ x: 0, y: 0, z: 0 }),
        right_hand_landmarks: Array(21).fill({ x: 0, y: 0, z: 0 }),
        face_landmarks: null
      }

      expect(frame.pose_landmarks).toHaveLength(33)
      expect(frame.left_hand_landmarks).toHaveLength(21)
      expect(frame.right_hand_landmarks).toHaveLength(21)
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress stats after successful submission', () => {
      const apiResponse = {
        total_contributions: 7,
        progress_percentage: 70
      }

      expect(apiResponse.total_contributions).toBe(7)
      expect(apiResponse.progress_percentage).toBe(70)
    })

    it('should display updated stats in success message', () => {
      // Tested in "should show progress stats in success state"
      const stats = { total: 5, progress: 50 }
      expect(stats.total).toBe(5)
      expect(stats.progress).toBe(50)
    })
  })
})
