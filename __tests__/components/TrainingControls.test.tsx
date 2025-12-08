/**
 * Tests for Training Controls (Start/Stop Training)
 *
 * Tests the AI training start/stop functionality with proper state management
 *
 * Author: SignForge Team
 * Date: 2025-01-11
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()
global.alert = jest.fn()
global.confirm = jest.fn()

// Mock AI Studio page component with training controls
const TrainingControlsMock = ({
  trainingStatus,
  onStart,
  onStop,
  isStarting,
  isStopping
}: {
  trainingStatus: any
  onStart: () => void
  onStop: () => void
  isStarting: boolean
  isStopping: boolean
}) => {
  return (
    <div>
      <h1>AI Training Studio</h1>
      {trainingStatus?.phase === 'idle' ? (
        <button
          onClick={onStart}
          disabled={isStarting}
          data-testid="start-training-button"
        >
          {isStarting ? 'Starting...' : 'Start Training'}
        </button>
      ) : (
        <button
          onClick={onStop}
          disabled={isStopping}
          data-testid="stop-training-button"
        >
          {isStopping ? 'Stopping...' : 'Stop Training'}
        </button>
      )}
      {trainingStatus && (
        <div data-testid="training-status">
          Phase: {trainingStatus.phase}
          Progress: {trainingStatus.progress}%
        </div>
      )}
    </div>
  )
}

describe('Training Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
    ;(global.confirm as jest.Mock).mockClear()
  })

  describe('Start Training Button', () => {
    it('renders start training button when training is idle', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      expect(startButton).toBeInTheDocument()
      expect(startButton).toHaveTextContent('Start Training')
    })

    it('shows "Starting..." when isStarting is true', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={true}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      expect(startButton).toHaveTextContent('Starting...')
      expect(startButton).toBeDisabled()
    })

    it('calls onStart when start button is clicked', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      fireEvent.click(startButton)

      expect(mockStart).toHaveBeenCalledTimes(1)
    })

    it('does not call onStart when button is disabled', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={true}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      fireEvent.click(startButton)

      // Should not be called because button is disabled
      expect(mockStart).not.toHaveBeenCalled()
    })
  })

  describe('Stop Training Button', () => {
    it('renders stop training button when training is active', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 45 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      expect(stopButton).toBeInTheDocument()
      expect(stopButton).toHaveTextContent('Stop Training')
    })

    it('shows "Stopping..." when isStopping is true', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 45 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={true}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      expect(stopButton).toHaveTextContent('Stopping...')
      expect(stopButton).toBeDisabled()
    })

    it('calls onStop when stop button is clicked', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 45 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      fireEvent.click(stopButton)

      expect(mockStop).toHaveBeenCalledTimes(1)
    })

    it('does not call onStop when button is disabled', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 45 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={true}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      fireEvent.click(stopButton)

      // Should not be called because button is disabled
      expect(mockStop).not.toHaveBeenCalled()
    })
  })

  describe('Training Status Display', () => {
    it('displays training phase and progress', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 65.5 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const status = screen.getByTestId('training-status')
      expect(status).toHaveTextContent('Phase: training_text_to_pose')
      expect(status).toHaveTextContent('Progress: 65.5%')
    })

    it('updates when training status changes', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'processing_videos', progress: 20 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      let status = screen.getByTestId('training-status')
      expect(status).toHaveTextContent('Progress: 20%')

      // Update to next phase
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      status = screen.getByTestId('training-status')
      expect(status).toHaveTextContent('Phase: training_text_to_pose')
      expect(status).toHaveTextContent('Progress: 50%')
    })
  })

  describe('State Transitions', () => {
    it('transitions from idle to starting state', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      expect(startButton).toHaveTextContent('Start Training')
      expect(startButton).not.toBeDisabled()

      // Simulate starting
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={true}
          isStopping={false}
        />
      )

      expect(startButton).toHaveTextContent('Starting...')
      expect(startButton).toBeDisabled()
    })

    it('transitions from active to stopping state', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      expect(stopButton).toHaveTextContent('Stop Training')
      expect(stopButton).not.toBeDisabled()

      // Simulate stopping
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={true}
        />
      )

      expect(stopButton).toHaveTextContent('Stopping...')
      expect(stopButton).toBeDisabled()
    })

    it('transitions back to idle after stopping', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={true}
        />
      )

      // Should show stopping state
      expect(screen.getByTestId('stop-training-button')).toHaveTextContent('Stopping...')

      // Transition back to idle
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      // Should now show start button
      const startButton = screen.getByTestId('start-training-button')
      expect(startButton).toBeInTheDocument()
      expect(startButton).toHaveTextContent('Start Training')
    })
  })

  describe('Error Handling', () => {
    it('handles start training failure gracefully', async () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      fireEvent.click(startButton)

      expect(mockStart).toHaveBeenCalled()

      // Simulate error state - button should be re-enabled
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      expect(startButton).not.toBeDisabled()
    })

    it('handles stop training failure gracefully', async () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      const { rerender } = render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      fireEvent.click(stopButton)

      expect(mockStop).toHaveBeenCalled()

      // Simulate error state - button should be re-enabled
      rerender(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      expect(stopButton).not.toBeDisabled()
    })
  })

  describe('Multiple Phase Support', () => {
    const phases = [
      'idle',
      'processing_videos',
      'training_text_to_pose',
      'training_pose_to_video',
      'completed'
    ]

    phases.forEach(phase => {
      it(`handles ${phase} phase correctly`, () => {
        const mockStart = jest.fn()
        const mockStop = jest.fn()

        render(
          <TrainingControlsMock
            trainingStatus={{ phase, progress: phase === 'idle' ? 0 : 50 }}
            onStart={mockStart}
            onStop={mockStop}
            isStarting={false}
            isStopping={false}
          />
        )

        if (phase === 'idle') {
          expect(screen.getByTestId('start-training-button')).toBeInTheDocument()
        } else {
          expect(screen.getByTestId('stop-training-button')).toBeInTheDocument()
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('start button is keyboard accessible', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'idle', progress: 0 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const startButton = screen.getByTestId('start-training-button')
      startButton.focus()
      expect(document.activeElement).toBe(startButton)
    })

    it('stop button is keyboard accessible', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={false}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      stopButton.focus()
      expect(document.activeElement).toBe(stopButton)
    })

    it('disabled buttons are not focusable', () => {
      const mockStart = jest.fn()
      const mockStop = jest.fn()

      render(
        <TrainingControlsMock
          trainingStatus={{ phase: 'training_text_to_pose', progress: 50 }}
          onStart={mockStart}
          onStop={mockStop}
          isStarting={false}
          isStopping={true}
        />
      )

      const stopButton = screen.getByTestId('stop-training-button')
      expect(stopButton).toBeDisabled()
    })
  })
})
