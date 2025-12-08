/**
 * Skeleton Canvas Component
 *
 * Renders pose landmark data on a canvas with animation support
 * Used for previewing sign language pose sequences
 */

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SkeletonCanvasProps {
  poseSequence: number[][][]; // [frames][landmarks][x,y,z,v]
  width?: number;
  height?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  fps?: number;
}

// MediaPipe landmark connections for rendering skeleton
const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
];

export default function SkeletonCanvas({
  poseSequence,
  width = 640,
  height = 480,
  autoPlay = false,
  showControls = true,
  fps = 30
}: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [frameRate] = useState(fps);

  // Draw a single frame
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !poseSequence || poseSequence.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const frame = poseSequence[frameIndex % poseSequence.length];
    if (!frame) return;

    // Scale factor for canvas
    const scaleX = width;
    const scaleY = height;

    // Draw pose landmarks (first 33 landmarks)
    ctx.strokeStyle = '#3B82F6'; // Blue for pose
    ctx.lineWidth = 2;
    ctx.fillStyle = '#3B82F6';

    POSE_CONNECTIONS.forEach(([start, end]) => {
      if (start < frame.length && end < frame.length) {
        const startPoint = frame[start];
        const endPoint = frame[end];

        if (startPoint && endPoint && startPoint[3] > 0.5 && endPoint[3] > 0.5) {
          ctx.beginPath();
          ctx.moveTo(startPoint[0] * scaleX, startPoint[1] * scaleY);
          ctx.lineTo(endPoint[0] * scaleX, endPoint[1] * scaleY);
          ctx.stroke();
        }
      }
    });

    // Draw pose landmarks as points
    for (let i = 0; i < Math.min(33, frame.length); i++) {
      const point = frame[i];
      if (point && point[3] > 0.5) {
        ctx.beginPath();
        ctx.arc(point[0] * scaleX, point[1] * scaleY, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw left hand (landmarks 33-54)
    if (frame.length > 33) {
      ctx.strokeStyle = '#10B981'; // Green for left hand
      ctx.fillStyle = '#10B981';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const leftHandStart = 33 + start;
        const leftHandEnd = 33 + end;

        if (leftHandStart < frame.length && leftHandEnd < frame.length) {
          const startPoint = frame[leftHandStart];
          const endPoint = frame[leftHandEnd];

          if (startPoint && endPoint && startPoint[3] > 0.5 && endPoint[3] > 0.5) {
            ctx.beginPath();
            ctx.moveTo(startPoint[0] * scaleX, startPoint[1] * scaleY);
            ctx.lineTo(endPoint[0] * scaleX, endPoint[1] * scaleY);
            ctx.stroke();
          }
        }
      });
    }

    // Draw right hand (landmarks 54-75)
    if (frame.length > 54) {
      ctx.strokeStyle = '#EF4444'; // Red for right hand
      ctx.fillStyle = '#EF4444';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const rightHandStart = 54 + start;
        const rightHandEnd = 54 + end;

        if (rightHandStart < frame.length && rightHandEnd < frame.length) {
          const startPoint = frame[rightHandStart];
          const endPoint = frame[rightHandEnd];

          if (startPoint && endPoint && startPoint[3] > 0.5 && endPoint[3] > 0.5) {
            ctx.beginPath();
            ctx.moveTo(startPoint[0] * scaleX, startPoint[1] * scaleY);
            ctx.lineTo(endPoint[0] * scaleX, endPoint[1] * scaleY);
            ctx.stroke();
          }
        }
      });
    }

    // Draw frame number
    ctx.fillStyle = '#000';
    ctx.font = '14px monospace';
    ctx.fillText(`Frame: ${frameIndex + 1}/${poseSequence.length}`, 10, 20);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % poseSequence.length);
    }, 1000 / frameRate);

    return () => clearInterval(interval);
  }, [isPlaying, poseSequence.length, frameRate]);

  // Redraw when frame changes
  useEffect(() => {
    drawFrame(currentFrame);
  }, [currentFrame, poseSequence]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-2 border-gray-300 rounded-lg bg-white"
      />

      {showControls && (
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="text-sm text-gray-600">
            Frame {currentFrame + 1} of {poseSequence.length}
          </div>
        </div>
      )}
    </div>
  );
}
