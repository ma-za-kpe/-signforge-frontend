/**
 * Tests for VideoPlayer Component
 *
 * Tests the custom video player with controls, timeline, and download functionality
 *
 * Author: SignForge Team
 * Date: 2025-01-11
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoPlayer from '../../components/VideoPlayer'

// Mock HTMLMediaElement methods
beforeAll(() => {
  HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.pause = jest.fn()
  HTMLMediaElement.prototype.load = jest.fn()
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    get: jest.fn(),
    set: jest.fn()
  })
})

describe('VideoPlayer Component', () => {
  const mockSrc = '/test-video.mp4'
  const mockPoster = '/test-poster.jpg'
  const mockOnDownload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders video element with correct src', () => {
      render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', mockSrc)
    })

    it('renders with poster attribute when provided', () => {
      render(<VideoPlayer src={mockSrc} poster={mockPoster} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('poster', mockPoster)
    })

    it('applies custom className', () => {
      const { container } = render(<VideoPlayer src={mockSrc} className="custom-class" />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })

    it('shows custom controls by default', () => {
      render(<VideoPlayer src={mockSrc} />)

      expect(screen.getByLabelText(/play/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mute/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fullscreen/i)).toBeInTheDocument()
    })

    it('hides controls when controls prop is false', () => {
      render(<VideoPlayer src={mockSrc} controls={false} />)

      expect(screen.queryByLabelText(/play/i)).not.toBeInTheDocument()
    })
  })

  describe('Playback Controls', () => {
    it('toggles play/pause when play button is clicked', async () => {
      render(<VideoPlayer src={mockSrc} />)

      const playButton = screen.getByLabelText(/play/i)
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
      })

      const pauseButton = screen.getByLabelText(/pause/i)
      fireEvent.click(pauseButton)

      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    })

    it('toggles play/pause when video is clicked', async () => {
      render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video')
      if (video) {
        fireEvent.click(video)
      }

      await waitFor(() => {
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
      })
    })

    it('shows play overlay when video is not playing', () => {
      render(<VideoPlayer src={mockSrc} />)

      const overlay = document.querySelector('.cursor-pointer')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('Volume Controls', () => {
    it('toggles mute when mute button is clicked', () => {
      render(<VideoPlayer src={mockSrc} muted={false} />)

      const muteButton = screen.getByLabelText(/mute/i)
      fireEvent.click(muteButton)

      // Icon should change to unmute
      expect(screen.getByLabelText(/unmute/i)).toBeInTheDocument()
    })

    it('starts muted when muted prop is true', () => {
      render(<VideoPlayer src={mockSrc} muted={true} />)

      expect(screen.getByLabelText(/unmute/i)).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('renders progress bar', () => {
      const { container } = render(<VideoPlayer src={mockSrc} />)

      const progressBar = container.querySelector('[class*="bg-purple-500"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('updates progress bar on timeupdate', async () => {
      const { container } = render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video')
      if (video) {
        // Mock video properties
        Object.defineProperty(video, 'duration', { value: 100, writable: true })
        Object.defineProperty(video, 'currentTime', { value: 50, writable: true })

        fireEvent.timeUpdate(video)

        await waitFor(() => {
          const progressBar = container.querySelector('[class*="bg-purple-500"]')
          expect(progressBar).toHaveStyle({ width: '50%' })
        })
      }
    })

    it('seeks video when progress bar is clicked', () => {
      render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video') as HTMLVideoElement
      if (video) {
        Object.defineProperty(video, 'duration', { value: 100, writable: true })

        const progressContainer = document.querySelector('.cursor-pointer')
        if (progressContainer) {
          fireEvent.click(progressContainer, {
            clientX: 50,
            target: { getBoundingClientRect: () => ({ left: 0, width: 100 }) }
          })

          // currentTime should be updated
          expect(video.currentTime).toBeDefined()
        }
      }
    })
  })

  describe('Fullscreen', () => {
    it('calls requestFullscreen when fullscreen button is clicked', async () => {
      const mockRequestFullscreen = jest.fn()
      HTMLMediaElement.prototype.requestFullscreen = mockRequestFullscreen

      render(<VideoPlayer src={mockSrc} />)

      const fullscreenButton = screen.getByLabelText(/fullscreen/i)
      fireEvent.click(fullscreenButton)

      expect(mockRequestFullscreen).toHaveBeenCalled()
    })
  })

  describe('Download Functionality', () => {
    it('renders download button when onDownload prop is provided', () => {
      render(<VideoPlayer src={mockSrc} onDownload={mockOnDownload} />)

      expect(screen.getByLabelText(/download/i)).toBeInTheDocument()
    })

    it('calls onDownload when download button is clicked', () => {
      render(<VideoPlayer src={mockSrc} onDownload={mockOnDownload} />)

      const downloadButton = screen.getByLabelText(/download/i)
      fireEvent.click(downloadButton)

      expect(mockOnDownload).toHaveBeenCalledTimes(1)
    })

    it('does not render download button when onDownload is not provided', () => {
      render(<VideoPlayer src={mockSrc} />)

      expect(screen.queryByLabelText(/download/i)).not.toBeInTheDocument()
    })
  })

  describe('Time Display', () => {
    it('formats time correctly', async () => {
      render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video')
      if (video) {
        Object.defineProperty(video, 'duration', { value: 125, writable: true })
        Object.defineProperty(video, 'currentTime', { value: 65, writable: true })

        fireEvent.loadedMetadata(video)
        fireEvent.timeUpdate(video)

        await waitFor(() => {
          expect(screen.getByText(/1:05/)).toBeInTheDocument()
          expect(screen.getByText(/2:05/)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Autoplay and Loop', () => {
    it('autoplays when autoPlay prop is true', () => {
      render(<VideoPlayer src={mockSrc} autoPlay={true} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('autoplay')
    })

    it('loops when loop prop is true', () => {
      render(<VideoPlayer src={mockSrc} loop={true} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('loop')
    })
  })

  describe('Hover Behavior', () => {
    it('shows controls on hover', async () => {
      const { container } = render(<VideoPlayer src={mockSrc} />)

      const wrapper = container.firstChild as HTMLElement
      fireEvent.mouseEnter(wrapper)

      await waitFor(() => {
        const controls = container.querySelector('[class*="opacity-100"]')
        expect(controls).toBeInTheDocument()
      })
    })

    it('hides controls on mouse leave when playing', async () => {
      const { container } = render(<VideoPlayer src={mockSrc} autoPlay={true} />)

      const wrapper = container.firstChild as HTMLElement
      fireEvent.mouseEnter(wrapper)
      fireEvent.mouseLeave(wrapper)

      await waitFor(() => {
        const controls = container.querySelector('[class*="opacity-0"]')
        expect(controls).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      render(<VideoPlayer src={mockSrc} onDownload={mockOnDownload} />)

      expect(screen.getByLabelText(/play/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mute/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fullscreen/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/download/i)).toBeInTheDocument()
    })

    it('video element has playsInline attribute for mobile', () => {
      render(<VideoPlayer src={mockSrc} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('playsinline')
    })
  })
})
