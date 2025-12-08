/**
 * WebcamRecorder Component Tests
 *
 * Tests the webcam recording flow including:
 * - Camera initialization
 * - Recording state management
 * - Video upload to backend
 * - Error handling
 * - Progress tracking
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WebcamRecorder from '@/components/contribution/WebcamRecorder';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  state: 'inactive',
  ondataavailable: null as ((event: BlobEvent) => void) | null,
  onstop: null as (() => void) | null,
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder) as any;
(global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

// Mock XMLHttpRequest for upload
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  status: 200,
  responseText: '',
};

(global as any).XMLHttpRequest = jest.fn(() => mockXHR);

// Setup MSW server for API mocking
const server = setupServer(
  http.post('/api/contribute/upload', async () => {
    return HttpResponse.json({
      pose_sequence: [[[0.5, 0.5, 0.5, 0.9]]],
      fps: 30,
      total_frames: 100,
      extracted_frames: 100,
      duration: 3.33,
      quality_breakdown: {
        overall_score: 0.85,
        hand_visibility: 0.9,
        motion_smoothness: 0.8,
        frame_completeness: 1.0,
        lighting_quality: 0.7,
      },
      quality_label: 'good',
      message: 'Video processed successfully',
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('WebcamRecorder', () => {
  const mockProps = {
    word: 'HELLO',
    userId: 'test-user-123',
    onUploadComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  describe('Camera Initialization', () => {
    it('should request camera access on mount', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      });
    });

    it('should display error message when camera access is denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Camera Error')).toBeInTheDocument();
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
      });
    });

    it('should show "Try Different Method" button on camera error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('No camera found'));

      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByText('Try Different Method');
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Recording Flow', () => {
    it('should show "Start Recording" button when camera is ready', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Recording')).toBeInTheDocument();
      });
    });

    it('should start countdown when "Start Recording" is clicked', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        const startButton = screen.getByText('Start Recording');
        fireEvent.click(startButton);
      });

      // Should show countdown (3, 2, 1)
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should show recording indicator with timer during recording', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        const startButton = screen.getByText('Start Recording');
        fireEvent.click(startButton);
      });

      // Wait for countdown to finish and recording to start
      await waitFor(() => {
        expect(screen.getByText(/REC/i)).toBeInTheDocument();
      }, { timeout: 4000 });
    });

    it('should show "Stop Recording" button during recording', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        const startButton = screen.getByText('Start Recording');
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Video Upload', () => {
    it('should show upload progress after recording stops', async () => {
      render(<WebcamRecorder {...mockProps} />);

      // Simulate recording complete
      mockMediaRecorder.onstop?.();

      await waitFor(() => {
        expect(screen.getByText(/Uploading video/i)).toBeInTheDocument();
      });
    });

    it('should display progress bar during upload', async () => {
      render(<WebcamRecorder {...mockProps} />);

      mockMediaRecorder.onstop?.();

      await waitFor(() => {
        // Progress bar should be visible
        const progressBar = document.querySelector('[style*="width"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should call onUploadComplete with result when upload succeeds', async () => {
      const onUploadComplete = jest.fn();
      render(<WebcamRecorder {...mockProps} onUploadComplete={onUploadComplete} />);

      // Simulate successful upload
      mockMediaRecorder.onstop?.();

      // Trigger XHR load event
      const loadCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        mockXHR.responseText = JSON.stringify({
          pose_sequence: [[[0.5, 0.5, 0.5, 0.9]]],
          fps: 30,
          total_frames: 100,
          extracted_frames: 100,
          duration: 3.33,
          quality_breakdown: {
            overall_score: 0.85,
            hand_visibility: 0.9,
            motion_smoothness: 0.8,
            frame_completeness: 1.0,
            lighting_quality: 0.7,
          },
          quality_label: 'good',
          message: 'Success',
        });
        loadCallback();
      }

      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalled();
      });
    });

    it('should handle upload errors gracefully', async () => {
      render(<WebcamRecorder {...mockProps} />);

      mockMediaRecorder.onstop?.();

      // Trigger XHR error event
      const errorCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        errorCallback();
      }

      await waitFor(() => {
        expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument();
      });
    });

    it('should handle server 500 errors with user-friendly message', async () => {
      render(<WebcamRecorder {...mockProps} />);

      mockMediaRecorder.onstop?.();

      // Simulate 500 error
      mockXHR.status = 500;
      const loadCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        mockXHR.responseText = JSON.stringify({
          detail: 'Internal server error',
        });
        loadCallback();
      }

      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Notice', () => {
    it('should display privacy guarantee notice', async () => {
      render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Privacy Guarantee')).toBeInTheDocument();
        expect(screen.getByText(/immediately deleted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = jest.fn();
      render(<WebcamRecorder {...mockProps} onCancel={onCancel} />);

      await waitFor(() => {
        const cancelButton = screen.getByText('Choose Different Method');
        fireEvent.click(cancelButton);
      });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should stop camera tracks on unmount', async () => {
      const mockStop = jest.fn();
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: mockStop }],
      });

      const { unmount } = render(<WebcamRecorder {...mockProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockStop).toHaveBeenCalled();
    });
  });
});
