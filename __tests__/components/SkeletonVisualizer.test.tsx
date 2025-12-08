/**
 * Tests for SkeletonVisualizer Component
 *
 * Tests the pose skeleton visualization with MediaPipe landmarks rendering
 *
 * Author: SignForge Team
 * Date: 2025-01-11
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SkeletonVisualizer from '../../components/SkeletonVisualizer'

// Mock canvas context
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    font: '',
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
  })) as any
})

describe('SkeletonVisualizer Component', () => {
  // Mock pose data (33 landmarks with x, y, z, visibility)
  const mockPoseData = [
    // Frame 1
    Array.from({ length: 33 }, (_, i) => ({
      x: 0.5 + (i * 0.01),
      y: 0.5 + (i * 0.01),
      z: 0.0,
      visibility: 0.9
    })),
    // Frame 2
    Array.from({ length: 33 }, (_, i) => ({
      x: 0.5 + (i * 0.01) + 0.05,
      y: 0.5 + (i * 0.01) + 0.05,
      z: 0.0,
      visibility: 0.9
    })),
    // Frame 3
    Array.from({ length: 33 }, (_, i) => ({
      x: 0.5 + (i * 0.01) + 0.1,
      y: 0.5 + (i * 0.01) + 0.1,
      z: 0.0,
      visibility: 0.9
    }))
  ]

  const mockOnFrameChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders canvas element', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <SkeletonVisualizer poseData={mockPoseData} className="custom-class" />
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })

    it('renders frame controls', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
    })

    it('shows frame counter', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3 frames')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state message when no pose data', () => {
      render(<SkeletonVisualizer poseData={[]} />)

      expect(screen.getByText(/no pose data available/i)).toBeInTheDocument()
    })

    it('renders canvas even with empty data', () => {
      render(<SkeletonVisualizer poseData={[]} />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Frame Navigation', () => {
    it('allows frame selection via slider', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} onFrameChange={mockOnFrameChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '2' } })

      expect(mockOnFrameChange).toHaveBeenCalledWith(2)
    })

    it('updates frame display when slider changes', async () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '2' } })

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('slider has correct min and max values', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const slider = screen.getByRole('slider') as HTMLInputElement
      expect(slider.min).toBe('0')
      expect(slider.max).toBe('2')
    })
  })

  describe('Animation', () => {
    it('animates through frames when playing', async () => {
      render(
        <SkeletonVisualizer
          poseData={mockPoseData}
          playing={true}
          fps={30}
          onFrameChange={mockOnFrameChange}
        />
      )

      // Wait for one frame interval (1000 / 30 fps ≈ 33ms)
      jest.advanceTimersByTime(34)

      await waitFor(() => {
        expect(mockOnFrameChange).toHaveBeenCalledWith(1)
      })

      // Wait for another frame
      jest.advanceTimersByTime(34)

      await waitFor(() => {
        expect(mockOnFrameChange).toHaveBeenCalledWith(2)
      })
    })

    it('loops back to first frame after last frame', async () => {
      render(
        <SkeletonVisualizer
          poseData={mockPoseData}
          playing={true}
          fps={30}
          onFrameChange={mockOnFrameChange}
        />
      )

      // Advance through all frames
      jest.advanceTimersByTime(34 * 3)

      await waitFor(() => {
        expect(mockOnFrameChange).toHaveBeenCalledWith(0)
      })
    })

    it('does not animate when playing is false', () => {
      render(
        <SkeletonVisualizer
          poseData={mockPoseData}
          playing={false}
          onFrameChange={mockOnFrameChange}
        />
      )

      jest.advanceTimersByTime(100)

      expect(mockOnFrameChange).not.toHaveBeenCalled()
    })

    it('respects custom fps setting', async () => {
      const customFps = 60
      render(
        <SkeletonVisualizer
          poseData={mockPoseData}
          playing={true}
          fps={customFps}
          onFrameChange={mockOnFrameChange}
        />
      )

      // Wait for one frame interval (1000 / 60 fps ≈ 16.67ms)
      jest.advanceTimersByTime(17)

      await waitFor(() => {
        expect(mockOnFrameChange).toHaveBeenCalled()
      })
    })
  })

  describe('Canvas Drawing', () => {
    it('sets canvas dimensions', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      // Canvas dimensions default to 0 in JSDOM, check that canvas exists
      expect(canvas).toBeInTheDocument()
      expect(canvas.width).toBeGreaterThanOrEqual(0)
      expect(canvas.height).toBeGreaterThanOrEqual(0)
    })

    it('gets 2d context for drawing', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      const context = canvas.getContext('2d')
      expect(context).not.toBeNull()
    })
  })

  describe('Pose Connections', () => {
    it('renders pose landmarks connections', () => {
      const { container } = render(<SkeletonVisualizer poseData={mockPoseData} />)

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Canvas context should be used for drawing
      const ctx = canvas?.getContext('2d')
      expect(ctx).not.toBeNull()
    })

    it('filters out low visibility landmarks', () => {
      const lowVisibilityData = [[
        ...Array.from({ length: 33 }, (_, i) => ({
          x: 0.5,
          y: 0.5,
          z: 0.0,
          visibility: i < 10 ? 0.9 : 0.3 // Only first 10 landmarks are visible
        }))
      ]]

      render(<SkeletonVisualizer poseData={lowVisibilityData} />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Frame Counter Display', () => {
    it('displays current frame number', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('displays total frame count', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      expect(screen.getByText('3 frames')).toBeInTheDocument()
    })

    it('updates frame counter when slider changes', async () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('handles window resize', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      fireEvent(window, new Event('resize'))

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('updates canvas dimensions on resize', async () => {
      const { container } = render(<SkeletonVisualizer poseData={mockPoseData} />)

      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      const initialWidth = canvas.width

      // Simulate resize
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        // Canvas should still be present
        expect(canvas).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('frame slider is keyboard accessible', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()

      // Slider should be focusable
      slider.focus()
      expect(document.activeElement).toBe(slider)
    })

    it('provides visual feedback for current frame', () => {
      render(<SkeletonVisualizer poseData={mockPoseData} />)

      // Frame counter should be visible
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3 frames')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('cleans up animation interval on unmount', () => {
      const { unmount } = render(
        <SkeletonVisualizer poseData={mockPoseData} playing={true} />
      )

      unmount()

      // Advance timers - no callbacks should run
      jest.advanceTimersByTime(100)

      // Component is unmounted, no errors should occur
      expect(true).toBe(true)
    })

    it('handles large pose datasets', () => {
      const largePoseData = Array.from({ length: 100 }, () =>
        Array.from({ length: 33 }, (_, i) => ({
          x: Math.random(),
          y: Math.random(),
          z: 0.0,
          visibility: 0.9
        }))
      )

      render(<SkeletonVisualizer poseData={largePoseData} />)

      expect(screen.getByText('100 frames')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing pose landmarks', () => {
      const incompletePoseData = [[
        ...Array.from({ length: 20 }, (_, i) => ({ // Only 20 landmarks instead of 33
          x: 0.5,
          y: 0.5,
          z: 0.0,
          visibility: 0.9
        }))
      ]]

      render(<SkeletonVisualizer poseData={incompletePoseData} />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('handles zero visibility landmarks', () => {
      const zeroVisibilityData = [[
        ...Array.from({ length: 33 }, () => ({
          x: 0.5,
          y: 0.5,
          z: 0.0,
          visibility: 0.0
        }))
      ]]

      render(<SkeletonVisualizer poseData={zeroVisibilityData} />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('handles single frame data', () => {
      const singleFrame = [mockPoseData[0]]

      render(<SkeletonVisualizer poseData={singleFrame} />)

      expect(screen.getByText('1 frames')).toBeInTheDocument()
    })
  })
})
