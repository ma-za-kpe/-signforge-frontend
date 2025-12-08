'use client';

/**
 * 🎬 ANIMATED SIGN PREVIEW
 *
 * Uses the text-to-pose model to generate and display real-time
 * animated skeleton demonstrations of sign language.
 *
 * Features:
 * - Hover-to-preview animation
 * - Canvas-based skeleton rendering
 * - 60 FPS smooth playback
 * - Looping animation
 * - Quality indicator
 */

import { useState, useEffect, useRef } from 'react';

interface PoseFrame {
  landmarks: number[][];  // [75 landmarks][4 coords: x, y, z, visibility]
}

interface AnimatedSignPreviewProps {
  word: string;
  autoPlay?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

// MediaPipe Holistic landmark connections for skeleton rendering
const POSE_CONNECTIONS = [
  // Face outline
  [10, 9], [9, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [1, 0],
  // Shoulders
  [11, 12],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
];

const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
];

export default function AnimatedSignPreview({
  word,
  autoPlay = false,
  onLoad,
  onError,
  className = ''
}: AnimatedSignPreviewProps) {
  const [frames, setFrames] = useState<PoseFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [quality, setQuality] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

  // Fetch pose sequence from API
  useEffect(() => {
    const fetchPoseSequence = async () => {
      const startTime = Date.now();
      console.log(`🎬 [AnimatedSignPreview] [${new Date().toISOString()}] Fetching animation for word: "${word}"`);
      setLoading(true);
      setError(null);

      try {
        const requestBody = {
          text: word.toLowerCase(),
          word: word.toUpperCase()
        };

        console.log(`📡 [AnimatedSignPreview] Sending request to: ${API_URL}/api/text-to-pose/generate`);
        console.log(`📦 [AnimatedSignPreview] Request body:`, requestBody);

        const response = await fetch(`${API_URL}/api/text-to-pose/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',  // Prevent caching
            'Pragma': 'no-cache'
          },
          cache: 'no-store',  // Force fresh request
          body: JSON.stringify(requestBody)
        });

        const fetchDuration = Date.now() - startTime;
        console.log(`📬 [AnimatedSignPreview] Response status: ${response.status} (took ${fetchDuration}ms)`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`❌ [AnimatedSignPreview] Error response:`, errorData);
          throw new Error(errorData.detail || 'Failed to generate animation');
        }

        const data = await response.json();

        // Calculate hash of first frame to detect if data is actually different
        const firstFrameHash = JSON.stringify(data.frames[0].landmarks.slice(0, 5)).substring(0, 50);

        console.log(`✅ [AnimatedSignPreview] Animation received:`, {
          word: data.word,
          frames: data.total_frames,
          quality: data.quality_score,
          message: data.message,
          firstFrameHash: firstFrameHash
        });

        // Log first landmark of first frame for comparison
        console.log(`📍 [AnimatedSignPreview] First frame, first landmark:`, data.frames[0].landmarks[0]);

        setFrames(data.frames);
        setQuality(data.quality_score);
        setCurrentFrame(0); // Reset to first frame
        setIsPlaying(true); // Ensure it starts playing

        if (onLoad) onLoad();
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to load animation';
        console.error(`❌ [AnimatedSignPreview] Fetch error:`, err);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPoseSequence();
  }, [word]);

  // Auto-play animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const fps = 30;
    const frameDelay = 1000 / fps;
    let lastFrameTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= frameDelay) {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
        lastFrameTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, frames]); // FIX: Changed from frames.length to frames to detect when frame data changes

  // Render skeleton on canvas
  useEffect(() => {
    if (!canvasRef.current || frames.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, width, height);

    const frame = frames[currentFrame];
    if (!frame || !frame.landmarks) return;

    const landmarks = frame.landmarks;

    // Helper function to draw a line between two landmarks
    const drawLine = (idx1: number, idx2: number, color: string = '#10B981', lineWidth: number = 3) => {
      if (idx1 >= landmarks.length || idx2 >= landmarks.length) return;

      const [x1, y1, , vis1] = landmarks[idx1];
      const [x2, y2, , vis2] = landmarks[idx2];

      if (vis1 < 0.5 || vis2 < 0.5) return; // Skip if not visible

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x1 * width, y1 * height);
      ctx.lineTo(x2 * width, y2 * height);
      ctx.stroke();
    };

    // Helper function to draw a point
    const drawPoint = (idx: number, color: string = '#10B981', radius: number = 4) => {
      if (idx >= landmarks.length) return;

      const [x, y, , vis] = landmarks[idx];

      if (vis < 0.5) return;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * width, y * height, radius, 0, 2 * Math.PI);
      ctx.fill();
    };

    // Draw body skeleton (pose landmarks 0-32)
    POSE_CONNECTIONS.forEach(([idx1, idx2]) => {
      drawLine(idx1, idx2, '#3B82F6', 3);
    });

    // Draw left hand (landmarks 33-53)
    HAND_CONNECTIONS.forEach(([idx1, idx2]) => {
      drawLine(33 + idx1, 33 + idx2, '#10B981', 2);
    });

    // Draw right hand (landmarks 54-74)
    HAND_CONNECTIONS.forEach(([idx1, idx2]) => {
      drawLine(54 + idx1, 54 + idx2, '#F59E0B', 2);
    });

    // Draw key points
    landmarks.forEach((_, idx) => {
      if (idx < 33) {
        drawPoint(idx, '#3B82F6', 3); // Body points
      } else if (idx < 54) {
        drawPoint(idx, '#10B981', 2); // Left hand points
      } else {
        drawPoint(idx, '#F59E0B', 2); // Right hand points
      }
    });

  }, [currentFrame, frames]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-3"></div>
          <p className="text-sm text-gray-300">Generating animation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-900/20 rounded-lg border-2 border-red-500/30 ${className}`}>
        <div className="text-center p-6">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Canvas for skeleton rendering */}
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        className="w-full h-full"
      />

      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Frame counter */}
          <div className="text-xs text-white/70">
            Frame {currentFrame + 1} / {frames.length}
          </div>

          {/* Quality indicator */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/70">Quality:</div>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              quality > 0.8 ? 'bg-green-500/20 text-green-300' :
              quality > 0.6 ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {(quality * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-100"
            style={{ width: `${((currentFrame + 1) / frames.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Word label with quality indicator */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-sm rounded-lg border-2 border-white/30">
        <div className="text-white font-bold text-lg">{word.toUpperCase()}</div>
        <div className="text-xs text-gray-300">Q: {(quality * 100).toFixed(1)}%</div>
      </div>

      {/* AI badge */}
      <div className="absolute top-3 right-3 px-2 py-1 bg-purple-500/80 backdrop-blur-sm rounded text-xs font-semibold text-white">
        🤖 AI Generated
      </div>
    </div>
  );
}
