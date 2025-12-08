/**
 * Strict Video Validation Rules for Sign Language Contributions
 *
 * These rules ensure high-quality, consistent data collection for the sign language dataset.
 * All validations are enforced on both frontend (UX) and backend (security).
 */

export const VIDEO_VALIDATION_RULES = {
  // File Format Rules
  ALLOWED_FORMATS: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
  ALLOWED_EXTENSIONS: ['.mp4', '.webm', '.mov'] as const,

  // Duration Rules (in seconds)
  MIN_DURATION: 2.0,    // Minimum 2 seconds to capture full sign
  MAX_DURATION: 12.0,   // Maximum 12 seconds to keep signs concise
  RECOMMENDED_DURATION: 5.0, // Recommended duration for best quality

  // File Size Rules
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB maximum
  RECOMMENDED_MAX_SIZE: 10 * 1024 * 1024, // 10MB recommended

  // Quality Rules
  MIN_QUALITY_SCORE: 0.60,  // 60% minimum quality to accept
  GOOD_QUALITY_THRESHOLD: 0.70,  // 70%+ is considered good
  EXCELLENT_QUALITY_THRESHOLD: 0.85, // 85%+ is excellent

  // Frame Rate Rules
  MIN_FPS: 15,  // Minimum 15 FPS
  RECOMMENDED_FPS: 30, // Recommended 30 FPS

  // Resolution Rules (recommended, not enforced)
  RECOMMENDED_MIN_WIDTH: 640,
  RECOMMENDED_MIN_HEIGHT: 480,
} as const;

export type VideoFormat = typeof VIDEO_VALIDATION_RULES.ALLOWED_FORMATS[number];

/**
 * Validation error types with user-friendly messages
 */
export const VALIDATION_ERRORS = {
  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    message: 'Invalid file format. Please upload MP4, WebM, or MOV files only.',
    severity: 'error' as const,
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: `File size exceeds ${VIDEO_VALIDATION_RULES.MAX_FILE_SIZE / 1024 / 1024}MB limit. Please use a smaller file or reduce video quality.`,
    severity: 'error' as const,
  },
  FILE_SIZE_WARNING: {
    code: 'FILE_SIZE_WARNING',
    message: `File size is large (>${VIDEO_VALIDATION_RULES.RECOMMENDED_MAX_SIZE / 1024 / 1024}MB). Consider compressing for faster upload.`,
    severity: 'warning' as const,
  },
  DURATION_TOO_SHORT: {
    code: 'DURATION_TOO_SHORT',
    message: `Video is too short (minimum ${VIDEO_VALIDATION_RULES.MIN_DURATION}s required). Please record a longer video showing the complete sign.`,
    severity: 'error' as const,
  },
  DURATION_TOO_LONG: {
    code: 'DURATION_TOO_LONG',
    message: `Video is too long (maximum ${VIDEO_VALIDATION_RULES.MAX_DURATION}s allowed). Please keep your sign concise.`,
    severity: 'error' as const,
  },
  QUALITY_TOO_LOW: {
    code: 'QUALITY_TOO_LOW',
    message: `Video quality is too low (minimum ${VIDEO_VALIDATION_RULES.MIN_QUALITY_SCORE * 100}% required). Please ensure good lighting and clear hand visibility.`,
    severity: 'error' as const,
  },
  NO_HANDS_DETECTED: {
    code: 'NO_HANDS_DETECTED',
    message: 'No hands detected in video. Please ensure your hands are clearly visible throughout the sign.',
    severity: 'error' as const,
  },
  POOR_LIGHTING: {
    code: 'POOR_LIGHTING',
    message: 'Lighting quality is poor. Please record in a well-lit environment for better results.',
    severity: 'warning' as const,
  },
} as const;

/**
 * User-friendly recording tips based on sign classification
 */
export const RECORDING_TIPS = {
  'one-handed': {
    'static': [
      'Keep your hand steady in the sign position for the full duration',
      'Ensure your hand is clearly visible against a plain background',
      'Record for 3-5 seconds to ensure quality detection',
    ],
    'dynamic': [
      'Perform the sign smoothly from start to finish',
      'Keep your hand in frame throughout the entire motion',
      'Record for 4-6 seconds to capture the complete movement',
    ],
  },
  'two-handed': {
    'static': [
      'Keep both hands steady in the sign position',
      'Ensure both hands are clearly visible and not overlapping excessively',
      'Record for 3-5 seconds for optimal quality',
    ],
    'dynamic': [
      'Perform the sign smoothly with both hands coordinated',
      'Keep both hands in frame throughout the motion',
      'Record for 5-7 seconds to capture the full sign',
    ],
  },
  general: [
    'Use good lighting - face a window or use bright indoor lights',
    'Use a plain, contrasting background (avoid busy patterns)',
    'Position camera at chest/face height for natural angle',
    'Keep your torso and head visible for context',
    'Minimize background movement and noise',
  ],
};

/**
 * Validate video file before upload
 */
export interface VideoValidationResult {
  isValid: boolean;
  errors: Array<typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS]>;
  warnings: Array<typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS]>;
  metadata?: {
    duration?: number;
    size: number;
    format: string;
    name: string;
  };
}

/**
 * Validate video file (client-side pre-upload validation)
 */
export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  const errors: VideoValidationResult['errors'] = [];
  const warnings: VideoValidationResult['warnings'] = [];

  // Validate file format
  if (!VIDEO_VALIDATION_RULES.ALLOWED_FORMATS.includes(file.type as VideoFormat)) {
    errors.push(VALIDATION_ERRORS.INVALID_FORMAT);
  }

  // Validate file size
  if (file.size > VIDEO_VALIDATION_RULES.MAX_FILE_SIZE) {
    errors.push(VALIDATION_ERRORS.FILE_TOO_LARGE);
  } else if (file.size > VIDEO_VALIDATION_RULES.RECOMMENDED_MAX_SIZE) {
    warnings.push(VALIDATION_ERRORS.FILE_SIZE_WARNING);
  }

  // Get video duration (requires loading video element)
  let duration: number | undefined;
  try {
    duration = await getVideoDuration(file);

    if (duration < VIDEO_VALIDATION_RULES.MIN_DURATION) {
      errors.push(VALIDATION_ERRORS.DURATION_TOO_SHORT);
    } else if (duration > VIDEO_VALIDATION_RULES.MAX_DURATION) {
      errors.push(VALIDATION_ERRORS.DURATION_TOO_LONG);
    }
  } catch (error) {
    console.warn('Could not determine video duration:', error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      duration,
      size: file.size,
      format: file.type,
      name: file.name,
    },
  };
}

/**
 * Get video duration from file
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(0);
  return `${mins}m ${secs}s`;
}

/**
 * Get quality label from score
 */
export function getQualityLabel(score: number): string {
  if (score >= VIDEO_VALIDATION_RULES.EXCELLENT_QUALITY_THRESHOLD) return 'Excellent';
  if (score >= VIDEO_VALIDATION_RULES.GOOD_QUALITY_THRESHOLD) return 'Good';
  if (score >= VIDEO_VALIDATION_RULES.MIN_QUALITY_SCORE) return 'Acceptable';
  return 'Poor';
}

/**
 * Get quality color for UI
 */
export function getQualityColor(score: number): string {
  if (score >= VIDEO_VALIDATION_RULES.EXCELLENT_QUALITY_THRESHOLD) return 'text-green-600';
  if (score >= VIDEO_VALIDATION_RULES.GOOD_QUALITY_THRESHOLD) return 'text-blue-600';
  if (score >= VIDEO_VALIDATION_RULES.MIN_QUALITY_SCORE) return 'text-yellow-600';
  return 'text-red-600';
}
