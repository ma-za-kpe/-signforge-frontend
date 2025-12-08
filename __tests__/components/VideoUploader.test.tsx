/**
 * VideoUploader Component Tests
 *
 * Tests the file upload flow including:
 * - File selection and validation
 * - Drag and drop
 * - Upload progress tracking
 * - Error handling
 * - Success callbacks
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoUploader from '@/components/contribution/VideoUploader';

// Mock XMLHttpRequest
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

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('VideoUploader', () => {
  const mockProps = {
    word: 'HELLO',
    userId: 'test-user-123',
    onUploadComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render upload zone', () => {
      render(<VideoUploader {...mockProps} />);

      expect(screen.getByText('Upload Your Sign Language Video')).toBeInTheDocument();
      expect(screen.getByText('Select Video File')).toBeInTheDocument();
    });

    it('should display validation requirements', () => {
      render(<VideoUploader {...mockProps} />);

      expect(screen.getByText(/Accepted formats:/i)).toBeInTheDocument();
      expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
      expect(screen.getByText(/Max size:/i)).toBeInTheDocument();
    });

    it('should show privacy guarantee notice', () => {
      render(<VideoUploader {...mockProps} />);

      expect(screen.getByText('Privacy Guarantee')).toBeInTheDocument();
      expect(screen.getByText(/immediately deleted/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
      });
    });

    it('should validate video duration', async () => {
      render(<VideoUploader {...mockProps} />);

      // Mock a video file with long duration
      const file = new File(['video content'], 'long-video.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Mock video element duration
      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'duration', { value: 15 }); // 15 seconds (over limit)

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        // Should show validation error for duration > 10 seconds
        expect(screen.getByText(/duration/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should validate file size', async () => {
      render(<VideoUploader {...mockProps} />);

      // Create file larger than 50MB
      const largeFile = new File(
        [new ArrayBuffer(51 * 1024 * 1024)],
        'large-video.mp4',
        { type: 'video/mp4' }
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/size/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', () => {
      render(<VideoUploader {...mockProps} />);

      const dropZone = screen.getByText('Upload Your Sign Language Video').closest('div');

      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('should handle file drop', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'dropped.mp4', { type: 'video/mp4' });
      const dropZone = screen.getByText('Upload Your Sign Language Video').closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.mp4')).toBeInTheDocument();
      });
    });

    it('should reset drag state on drag leave', () => {
      render(<VideoUploader {...mockProps} />);

      const dropZone = screen.getByText('Upload Your Sign Language Video').closest('div');

      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(dropZone).not.toHaveClass('border-blue-500');
    });
  });

  describe('Upload Process', () => {
    it('should show upload button for valid file', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'valid.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('Upload and Process Video')).toBeInTheDocument();
      });
    });

    it('should track upload progress', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

      // Simulate progress event
      const progressCallback = mockXHR.upload.addEventListener.mock.calls.find(
        call => call[0] === 'progress'
      )?.[1];

      if (progressCallback) {
        progressCallback({ lengthComputable: true, loaded: 50, total: 100 });
      }

      await waitFor(() => {
        expect(screen.getByText(/Uploading video/i)).toBeInTheDocument();
      });
    });

    it('should show processing state after upload completes', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

      // Simulate successful upload
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
        expect(screen.getByText(/Processing video/i)).toBeInTheDocument();
      });
    });

    it('should call onUploadComplete with result', async () => {
      const onUploadComplete = jest.fn();
      render(<VideoUploader {...mockProps} onUploadComplete={onUploadComplete} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

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
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

      const errorCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        errorCallback();
      }

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with detail message', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

      mockXHR.status = 400;
      const loadCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        mockXHR.responseText = JSON.stringify({
          detail: 'Invalid video format',
        });
        loadCallback();
      }

      await waitFor(() => {
        expect(screen.getByText(/Invalid video format/i)).toBeInTheDocument();
      });
    });

    it('should show "Try Again" button on error', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload and Process Video');
        fireEvent.click(uploadButton);
      });

      const errorCallback = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        errorCallback();
      }

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should show cancel button when onCancel prop is provided', () => {
      render(<VideoUploader {...mockProps} />);

      expect(screen.getByText('Choose Different Method')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<VideoUploader {...mockProps} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Choose Different Method');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('File Cleanup', () => {
    it('should clear file when clear button is clicked', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText('test.mp4')).not.toBeInTheDocument();
      });
    });

    it('should revoke blob URL on clear', async () => {
      render(<VideoUploader {...mockProps} />);

      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const clearButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(clearButton);

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
