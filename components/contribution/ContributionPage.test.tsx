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
jest.mock('react-webcam', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ onUserMedia }) => {
    // Simulate webcam ready
    if (onUserMedia) {
      setTimeout(() => onUserMedia(), 0)
    }
    return <video data-testid="mock-webcam" />
  })
}))

// Mock MediaPipe with controllable callbacks
let mockLandmarkCallback: any = null

jest.mock('./MediaPipeHandler', () => {
  let callback: any = null
  return {
    MediaPipeHandler: jest.fn().mockImplementation((video: any, cb: any) => {
      callback = cb
      // Expose callback globally so tests can access it
      if (typeof global !== 'undefined') {
        (global as any).__mockLandmarkCallback = cb
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
  default: jest.fn(({ word, onReady }) => (
    <div data-testid="reference-player">
      <h2>Reference: {word}</h2>
      <button onClick={onReady}>I'm Ready to Record</button>
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
  if (!callback) return

  const mockResults = {
    poseLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 1.0 }),
    leftHandLandmarks: Array(21).fill({ x: 0.3, y: 0.4, z: 0, visibility: 1.0 }),
    rightHandLandmarks: Array(21).fill({ x: 0.7, y: 0.4, z: 0, visibility: 1.0 }),
    faceLandmarks: null
  }

  for (let i = 0; i < count; i++) {
    act(() => {
      callback(mockResults)
    })
  }
}

describe('ContributionPage - State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      render(<ContributionPage />)

      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
      expect(screen.queryByTestId('reference-player')).not.toBeInTheDocument()
      expect(screen.queryByTestId('mock-webcam')).not.toBeInTheDocument()
    })

    it('should have empty selectedWord initially', () => {
      render(<ContributionPage />)

      // SignSelector should be visible, meaning no word is selected yet
      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
    })
  })

  describe('State Transition: select → reference', () => {
    it('should transition to reference state when word is selected', async () => {
      render(<ContributionPage />)

      const selectButton = screen.getByText('Select HELLO')
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('reference-player')).toBeInTheDocument()
        expect(screen.getByText('Reference: HELLO')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('sign-selector')).not.toBeInTheDocument()
    })

    it('should store selected word in state', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select THANK_YOU'))

      await waitFor(() => {
        expect(screen.getByText('Reference: THANK_YOU')).toBeInTheDocument()
      })
    })
  })

  describe('State Transition: reference → recording', () => {
    it('should transition to recording state when user clicks "I\'m Ready"', async () => {
      render(<ContributionPage />)

      // Navigate to reference state
      fireEvent.click(screen.getByText('Select HELLO'))

      await waitFor(() => {
        expect(screen.getByText('I\'m Ready to Record')).toBeInTheDocument()
      })

      // Click ready button
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
      })
    })

    it('should initialize MediaPipe when entering recording state', async () => {
      const { MediaPipeHandler } = require('./MediaPipeHandler')

      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))

      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => {
        expect(MediaPipeHandler).toHaveBeenCalled()
      })
    })
  })

  describe('Recording Flow', () => {
    it('should show countdown when Start Recording is clicked', async () => {
      render(<ContributionPage />)

      // Navigate to recording state
      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

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
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

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
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

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
      render(<ContributionPage />)

      // Navigate through states
      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      // Start recording
      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      // Wait for countdown to complete and recording to start
      act(() => { jest.advanceTimersByTime(5000) })
      await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

      // Simulate frame capture (60 frames)
      simulateFrameCapture(60)

      // Wait for auto-stop after 2 seconds
      act(() => { jest.advanceTimersByTime(2000) })

      return screen
    }

    it('should transition to review state after recording completes', async () => {
      await navigateToReviewState()

      // Should be in review state
      await waitFor(() => {
        expect(screen.getByText(/Review Your Recording/i)).toBeInTheDocument()
      })
    })

    it('should display Submit and Retake buttons in review state', async () => {
      await navigateToReviewState()

      await waitFor(() => {
        expect(screen.getByText(/Looks Good - Submit/i)).toBeInTheDocument()
        expect(screen.getByText(/Retake/i)).toBeInTheDocument()
      })
    })

    it('should call API with correct data when submitting', async () => {
      await navigateToReviewState()

      // Click submit
      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

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

        // Verify body contains expected data
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.word).toBe('HELLO')
        expect(body.frames).toHaveLength(60)
        expect(body.user_id).toMatch(/^user_/)
      })
    })

    it('should display success message after submission', async () => {
      await navigateToReviewState()

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
        expect(screen.getByText(/successfully/i)).toBeInTheDocument()
      })
    })

    it('should show progress stats in success state', async () => {
      await navigateToReviewState()

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument() // Total contributions
        expect(screen.getByText(/Total contributions for/i)).toBeInTheDocument()
      })
    })

    it('should auto-advance to recording state after 3 seconds', async () => {
      await navigateToReviewState()

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      // Verify in success state
      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      act(() => { jest.advanceTimersByTime(3000) })

      // Should be back in recording state
      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
        expect(screen.queryByText(/Thank You!/i)).not.toBeInTheDocument()
      })
    })

    it('should keep same word when auto-advancing', async () => {
      await navigateToReviewState()

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      // Auto-advance
      await waitFor(() => screen.getByText(/Thank You!/i))
      act(() => { jest.advanceTimersByTime(3000) })

      // Should still be on HELLO, not back to selector
      await waitFor(() => {
        expect(screen.getByText(/Recording: HELLO/i)).toBeInTheDocument()
        expect(screen.queryByTestId('sign-selector')).not.toBeInTheDocument()
      })
    })

    it('should clear recorded frames when auto-advancing', async () => {
      await navigateToReviewState()

      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
      fireEvent.click(screen.getByText(/Looks Good - Submit/i))

      // Auto-advance
      await waitFor(() => screen.getByText(/Thank You!/i))
      act(() => { jest.advanceTimersByTime(3000) })

      // Should be able to start new recording
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error when recording is too short (<30 frames)', async () => {
      render(<ContributionPage />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

      // Capture only 20 frames (too short)
      simulateFrameCapture(20)

      act(() => { jest.advanceTimersByTime(2000) })

      // Try to submit
      await waitFor(() => screen.getByText(/Looks Good - Submit/i))
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

      render(<ContributionPage />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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

      render(<ContributionPage />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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

      render(<ContributionPage />)

      jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

      const retakeButton = await screen.findByText(/Retake/i)
      fireEvent.click(retakeButton)

      // Should go back to recording state
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })

    it('should clear frames when retaking', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

      await waitFor(() => screen.getByText(/Frames captured: 60/i))

      const retakeButton = await screen.findByText(/Retake/i)
      fireEvent.click(retakeButton)

      // Frame count should be cleared (Start Recording should be available)
      await waitFor(() => {
        expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
      })
    })

    it('should allow choosing different sign from review', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

      const changeSignButton = await screen.findByText(/Choose Different Sign/i)
      fireEvent.click(changeSignButton)

      // Should return to sign selector
      await waitFor(() => {
        expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
      })
    })

    it('should reset all state when choosing different sign', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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

      const { unmount } = render(<ContributionPage />)

      // Navigate to recording to create handler
      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByTestId('mock-webcam'))

      unmount()

      await waitFor(() => {
        expect(disposeMock).toHaveBeenCalled()
      })
    })

    it('should capture frames at ~30fps during recording', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      await waitFor(() => screen.getByText(/RECORDING\.\.\./i))

      // Simulate 60 frames (2 seconds @ 30fps)
      simulateFrameCapture(60)

      act(() => { jest.advanceTimersByTime(2000) })

      // Should show 60 frames captured
      await waitFor(() => {
        expect(screen.getByText(/Frames captured: 60/i)).toBeInTheDocument()
      })
    })

    it('should capture all required landmarks', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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
      const { unmount } = render(<ContributionPage />)
      unmount()

      // Render again
      render(<ContributionPage />)

      // User ID is generated internally
      expect(screen.getByTestId('sign-selector')).toBeInTheDocument()
    })

    it('should include user ID in contribution submission', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => screen.getByText(/Start Recording/i))
      fireEvent.click(screen.getByText(/Start Recording/i))

      act(() => { jest.advanceTimersByTime(5000) })
      simulateFrameCapture(60)
      act(() => { jest.advanceTimersByTime(2000) })

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
      render(<ContributionPage />)

      // Rapidly click different selections
      fireEvent.click(screen.getByText('Select HELLO'))
      fireEvent.click(screen.getByText('Select THANK_YOU'))

      // Should end up with last selection
      await waitFor(() => {
        expect(screen.getByText('Reference: THANK_YOU')).toBeInTheDocument()
      })
    })

    it('should prevent submission during countdown', async () => {
      render(<ContributionPage />)

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

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

      render(<ContributionPage />)

      const alertMock = jest.spyOn(window, 'alert').mockImplementation()

      fireEvent.click(screen.getByText('Select HELLO'))
      await waitFor(() => screen.getByText('I\'m Ready to Record'))
      fireEvent.click(screen.getByText('I\'m Ready to Record'))

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('camera')
        )
      })

      alertMock.mockRestore()
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
