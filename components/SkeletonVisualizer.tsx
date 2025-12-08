'use client'

import React, { useRef, useEffect, useState } from 'react'

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

interface SkeletonVisualizerProps {
  poseData: PoseLandmark[][] // Array of frames, each containing 75 landmarks (33 pose + 21 left hand + 21 right hand)
  className?: string
  playing?: boolean
  fps?: number
  onFrameChange?: (frameIndex: number) => void
  word?: string // The word being signed
}

// MediaPipe Pose connections (indices 0-32)
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [9, 10],
  // Arms
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Body
  [11, 23], [12, 24], [23, 24],
  // Legs
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
]

// Left Hand connections (indices 33-53)
const LEFT_HAND_CONNECTIONS = [
  // Thumb: wrist → thumb chain
  [33, 34], [34, 35], [35, 36], [36, 37],
  // Index: wrist → index chain
  [33, 38], [38, 39], [39, 40], [40, 41],
  // Middle: wrist → middle chain
  [33, 42], [42, 43], [43, 44], [44, 45],
  // Ring: wrist → ring chain
  [33, 46], [46, 47], [47, 48], [48, 49],
  // Pinky: wrist → pinky chain
  [33, 50], [50, 51], [51, 52], [52, 53]
]

// Right Hand connections (indices 54-74)
const RIGHT_HAND_CONNECTIONS = [
  // Thumb: wrist → thumb chain
  [54, 55], [55, 56], [56, 57], [57, 58],
  // Index: wrist → index chain
  [54, 59], [59, 60], [60, 61], [61, 62],
  // Middle: wrist → middle chain
  [54, 63], [63, 64], [64, 65], [65, 66],
  // Ring: wrist → ring chain
  [54, 67], [67, 68], [68, 69], [69, 70],
  // Pinky: wrist → pinky chain
  [54, 71], [71, 72], [72, 73], [73, 74]
]

export default function SkeletonVisualizer({
  poseData,
  className = '',
  playing = false,
  fps = 30,
  onFrameChange,
  word
}: SkeletonVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })

  // Animation loop - play at 50% speed for better visibility
  useEffect(() => {
    if (!playing || !poseData || poseData.length === 0) return

    const playbackSpeed = 0.5 // Play at 50% speed (slower)
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = (prev + 1) % poseData.length
        if (onFrameChange) onFrameChange(next)
        return next
      })
    }, 1000 / (fps * playbackSpeed))

    return () => clearInterval(interval)
  }, [playing, poseData, fps, onFrameChange])

  // Draw skeleton
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !poseData || poseData.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const frame = poseData[currentFrame]
    if (!frame) return

    // Calculate bounding box for centering and scaling
    const visiblePoints = frame.filter(p => p && p[3] > 0.3)
    if (visiblePoints.length === 0) return

    const minX = Math.min(...visiblePoints.map(p => p[0]))
    const maxX = Math.max(...visiblePoints.map(p => p[0]))
    const minY = Math.min(...visiblePoints.map(p => p[1]))
    const maxY = Math.max(...visiblePoints.map(p => p[1]))

    const rangeX = maxX - minX
    const rangeY = maxY - minY
    const padding = 0.1

    // Scale and center the pose
    const scaleX = canvas.width * (1 - 2 * padding) / (rangeX || 1)
    const scaleY = canvas.height * (1 - 2 * padding) / (rangeY || 1)
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (canvas.width - (rangeX * scale)) / 2 - (minX * scale)
    const offsetY = (canvas.height - (rangeY * scale)) / 2 - (minY * scale)

    // Transform function
    const transformPoint = (point: any) => {
      return {
        x: point[0] * scale + offsetX,
        y: point[1] * scale + offsetY,
        visibility: point[3]
      }
    }

    // Draw connections with gradient colors
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Draw pose connections (body)
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = frame[start]
      const endPoint = frame[end]

      if (startPoint && endPoint &&
          startPoint[3] > 0.3 && endPoint[3] > 0.3) {
        const p1 = transformPoint(startPoint)
        const p2 = transformPoint(endPoint)

        // Color code different body parts
        let color = '#8b5cf6' // Default purple
        if (start >= 11 && start <= 22 || end >= 11 && end <= 22) {
          color = '#3b82f6' // Blue for arms
        } else if (start >= 23 || end >= 23) {
          color = '#10b981' // Green for legs
        } else if (start <= 10 && end <= 10) {
          color = '#f59e0b' // Orange for face
        }

        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    })

    // Draw LEFT HAND connections (Natural skin tone)
    ctx.lineWidth = 2  // Very thin for realistic finger movement
    LEFT_HAND_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = frame[start]
      const endPoint = frame[end]

      if (startPoint && endPoint &&
          startPoint[3] > 0.1 && endPoint[3] > 0.1) {
        const p1 = transformPoint(startPoint)
        const p2 = transformPoint(endPoint)

        ctx.strokeStyle = '#FFD700'  // Gold color for left hand
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    })

    // Draw RIGHT HAND connections (Natural blue accent)
    RIGHT_HAND_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = frame[start]
      const endPoint = frame[end]

      if (startPoint && endPoint &&
          startPoint[3] > 0.1 && endPoint[3] > 0.1) {
        const p1 = transformPoint(startPoint)
        const p2 = transformPoint(endPoint)

        ctx.strokeStyle = '#4169E1'  // Royal blue for right hand
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    })

    ctx.lineWidth = 4  // Reset line width

    // Draw landmarks
    frame.forEach((landmark, index) => {
      if (landmark && landmark[3] > 0.1) {  // Lower threshold to show more hand points
        const p = transformPoint(landmark)

        // Color code landmarks
        let color = '#a78bfa' // Default purple
        let size = 4  // Smaller, more realistic

        if (index >= 33 && index <= 53) {
          // Left hand landmarks - Gold
          color = '#FFD700'
          // Wrist (index 33) gets size 1, finger joints get size 2
          size = index === 33 ? 1 : 2
        } else if (index >= 54 && index <= 74) {
          // Right hand landmarks - Royal Blue
          color = '#4169E1'
          // Wrist (index 54) gets size 1, finger joints get size 2
          size = index === 54 ? 1 : 2
        } else if (index >= 11 && index <= 22) {
          color = '#60a5fa' // Light blue for arms
          size = 5
        } else if (index >= 23) {
          color = '#34d399' // Light green for legs
          size = 5
        } else if (index <= 10) {
          color = '#fbbf24' // Light orange for face
          size = 4
        }

        // Draw landmark point
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, 2 * Math.PI)
        ctx.fill()

        // Draw white outline only for larger body landmarks
        if (size > 2) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    })

    // Draw frame counter at bottom left
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`Frame: ${currentFrame + 1}/${poseData.length}`, 10, canvas.height - 10)

  }, [poseData, currentFrame, dimensions, word])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const parent = canvas.parentElement
      if (parent) {
        const { width, height } = parent.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Frame Controls */}
      <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
        <input
          type="range"
          min="0"
          max={poseData.length - 1}
          value={currentFrame}
          onChange={(e) => {
            const frame = parseInt(e.target.value)
            setCurrentFrame(frame)
            if (onFrameChange) onFrameChange(frame)
          }}
          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-purple-500"
        />
        <div className="flex justify-between text-xs text-white mt-1">
          <span>{currentFrame + 1}</span>
          <span>{poseData.length} frames</span>
        </div>
      </div>

      {/* Empty state */}
      {(!poseData || poseData.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400">No pose data available</p>
        </div>
      )}
    </div>
  )
}
