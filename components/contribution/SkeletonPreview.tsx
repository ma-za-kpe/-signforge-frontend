'use client'

import { useEffect, useRef, useState } from 'react'

interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface Frame {
  frame_number: number
  timestamp: number
  pose_landmarks: Landmark[]
  left_hand_landmarks: Landmark[] | null
  right_hand_landmarks: Landmark[] | null
  face_landmarks: Landmark[] | null
}

interface SkeletonPreviewProps {
  frames: Frame[]
  isPlaying?: boolean
  onPlaybackComplete?: () => void
}

export default function SkeletonPreview({ frames, isPlaying = false, onPlaybackComplete }: SkeletonPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      setCurrentFrame(0)
      return
    }

    startTimeRef.current = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const frameIndex = Math.floor(elapsed * 30) // Assuming 30fps

      if (frameIndex >= frames.length) {
        setCurrentFrame(frames.length - 1)
        onPlaybackComplete?.()
        return
      }

      setCurrentFrame(frameIndex)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, frames, onPlaybackComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || frames.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frame = frames[currentFrame]
    if (!frame) return

    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const width = canvas.width
    const height = canvas.height

    // Draw pose skeleton
    if (frame.pose_landmarks && frame.pose_landmarks.length >= 33) {
      const pose = frame.pose_landmarks

      // Pose connections (simplified - major body parts)
      const connections = [
        // Face
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
        // Torso
        [11, 12], [11, 23], [12, 24], [23, 24],
        // Left arm
        [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
        // Right arm
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
        // Left leg
        [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
        // Right leg
        [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
      ]

      // Draw connections
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      connections.forEach(([i, j]) => {
        const a = pose[i]
        const b = pose[j]
        if (a && b && (a.visibility || 0) > 0.5 && (b.visibility || 0) > 0.5) {
          ctx.beginPath()
          ctx.moveTo(a.x * width, a.y * height)
          ctx.lineTo(b.x * width, b.y * height)
          ctx.stroke()
        }
      })

      // Draw joints
      ctx.fillStyle = '#00ff00'
      pose.forEach(lm => {
        if (lm && (lm.visibility || 0) > 0.5) {
          ctx.beginPath()
          ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    }

    // Draw left hand
    if (frame.left_hand_landmarks && frame.left_hand_landmarks.length === 21) {
      drawHand(ctx, frame.left_hand_landmarks, width, height, '#ff6b6b')
    }

    // Draw right hand
    if (frame.right_hand_landmarks && frame.right_hand_landmarks.length === 21) {
      drawHand(ctx, frame.right_hand_landmarks, width, height, '#4dabf7')
    }

    // Draw frame info
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px monospace'
    ctx.fillText(`Frame: ${currentFrame + 1}/${frames.length}`, 10, 20)
    ctx.fillText(`Time: ${frame.timestamp.toFixed(2)}s`, 10, 40)

  }, [currentFrame, frames])

  const drawHand = (ctx: CanvasRenderingContext2D, hand: Landmark[], width: number, height: number, color: string) => {
    // Hand connections
    const connections = [
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
      // Palm
      [5, 9], [9, 13], [13, 17]
    ]

    // Draw connections
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    connections.forEach(([i, j]) => {
      const a = hand[i]
      const b = hand[j]
      if (a && b) {
        ctx.beginPath()
        ctx.moveTo(a.x * width, a.y * height)
        ctx.lineTo(b.x * width, b.y * height)
        ctx.stroke()
      }
    })

    // Draw joints
    ctx.fillStyle = color
    hand.forEach(lm => {
      if (lm) {
        ctx.beginPath()
        ctx.arc(lm.x * width, lm.y * height, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }

  if (frames.length === 0) {
    return (
      <div className="flex items-center justify-center bg-black rounded-lg" style={{ aspectRatio: '16/9' }}>
        <p className="text-white">No frames to preview</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full rounded-lg bg-black"
        style={{ aspectRatio: '16/9' }}
      />
      <div className="mt-2 text-center text-sm text-gray-600">
        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">Body</span>
        <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Left Hand</span>
        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Right Hand</span>
      </div>
    </div>
  )
}
