'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Webcam from 'react-webcam'
import { MediaPipeHandler, LandmarkResult, drawSkeletonOverlay } from './MediaPipeHandler'
import ReferencePlayer from './ReferencePlayer'
import SignSelector from './SignSelector'
import SignClassification from './SignClassification'
import RecordingFeedback from './RecordingFeedback'
import SkeletonPreview from './SkeletonPreview'
import CommunityContributions from './CommunityContributions'
import QualityFeedback from './QualityFeedback'
import LightingQualityMeter from './LightingQualityMeter'
import HandVisibilityIndicator from './HandVisibilityIndicator'
import QualityScoreBreakdown from './QualityScoreBreakdown'

type PageState = 'select' | 'community' | 'reference' | 'classification' | 'environment-check' | 'recording' | 'review' | 'success'

interface Frame {
  frame_number: number
  timestamp: number
  pose_landmarks: any[]
  left_hand_landmarks: any[] | null
  right_hand_landmarks: any[] | null
  face_landmarks: any[] | null
}

interface ContributionPageProps {
  maxAttempts?: number  // For testing: default 3, can be set to 1
  testMode?: boolean    // For testing: bypasses setTimeout delays
}

export default function ContributionPage({ maxAttempts = 3, testMode = false }: ContributionPageProps) {
  // URL parameters
  const searchParams = useSearchParams()

  // State management
  const [pageState, setPageState] = useState<PageState>('select')
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const isRecordingRef = useRef(false)
  const [recordedFrames, setRecordedFrames] = useState<Frame[]>([])
  const [contributionStats, setContributionStats] = useState({ total: 0, progress: 0 })
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [showCompletionFlash, setShowCompletionFlash] = useState(false)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const [selectorKey, setSelectorKey] = useState(0)
  const [userId] = useState(() => {
    // Generate anonymous user ID (client-side)
    return `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
  })
  const [signClassification, setSignClassification] = useState<{
    sign_type_movement: 'static' | 'dynamic'
    sign_type_hands: 'one-handed' | 'two-handed'
  } | null>(null)

  // 3-attempt recording state
  const [currentAttempt, setCurrentAttempt] = useState(1)
  const [attemptData, setAttemptData] = useState<Array<{
    frames: Frame[]
    quality: number
    duration: number
  }>>([])
  const [showAttemptReview, setShowAttemptReview] = useState(false)

  // Environment check state
  const [environmentCheck, setEnvironmentCheck] = useState<{
    lighting_quality: number
    hand_visibility: number
    frame_completeness: number
    can_proceed: boolean
    lighting_label: string
    recommendations: string[]
  } | null>(null)
  // Environment check is now real-time, no need for frame collection or API calls

  // Quality breakdown state
  const [qualityBreakdown, setQualityBreakdown] = useState<{
    overall_score: number
    hand_visibility: number
    motion_smoothness: number
    frame_completeness: number
    lighting_quality: number
    components: {
      overall: string
      hand_visibility: string
      motion_smoothness: string
      frame_completeness: string
      lighting: string
    }
    recommendations: string[]
  } | null>(null)

  // Auto-select word from URL parameter
  useEffect(() => {
    const wordParam = searchParams.get('word')
    if (wordParam) {
      setSelectedWord(wordParam.toUpperCase())
      setPageState('reference')
    }
  }, [searchParams])

  // Refs
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaPipeHandlerRef = useRef<MediaPipeHandler | null>(null)
  const recordingStartTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopRecordingRef = useRef<(() => void) | null>(null)

  // Track recording progress and auto-stop fallback
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        if (!recordingStartTimeRef.current) {
          console.error('❌ recordingStartTimeRef not set!')
          return
        }
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000
        console.log('⏱ Timer tick:', elapsed.toFixed(2), 's')
        setRecordingElapsed(elapsed)
        setRecordingProgress((elapsed / 4.0) * 100)

        if (elapsed >= 4.5) {
          console.log('⏱ Timer fallback stopping recording at', elapsed.toFixed(2), 's')
          clearInterval(recordingTimerRef.current!)
          stopRecording()
        }
      }, 100)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setRecordingElapsed(0)
      setRecordingProgress(0)
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  // Auto-advance from success state after 3 seconds (back to recording for another cycle)
  useEffect(() => {
    if (pageState === 'success') {
      const handleAutoAdvance = () => {
        console.log('⏰ Auto-advancing from success to recording')
        setCurrentAttempt(1)
        setAttemptData([])
        setRecordedFrames([])
        setPageState('recording')
      }

      if (testMode) {
        // In test mode, don't auto-advance immediately, let timers be controlled
        const timer = setTimeout(handleAutoAdvance, 3000)
        return () => clearTimeout(timer)
      } else {
        // Production: auto-advance after 3 seconds
        const timer = setTimeout(handleAutoAdvance, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [pageState, testMode])

  const initializeMediaPipe = async () => {
    if (!webcamRef.current?.video) return

    const videoElement = webcamRef.current.video as HTMLVideoElement

    mediaPipeHandlerRef.current = new MediaPipeHandler(videoElement, handleLandmarkResults)

    try {
      await mediaPipeHandlerRef.current.initialize()
      await mediaPipeHandlerRef.current.start()
      console.log('✓ MediaPipe ready for recording')
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error)
      toast.error('Failed to start camera. Please check permissions and try again.', { duration: 5000 })
    }
  }

  const handleLandmarkResults = useCallback((results: LandmarkResult) => {
    console.log('📸 handleLandmarkResults called, pageState:', pageState, 'isRecording:', isRecordingRef.current)

    // Draw skeleton overlay
    if (canvasRef.current && webcamRef.current?.video) {
      const video = webcamRef.current.video
      const canvas = canvasRef.current

      // Sync canvas size with video display size
      const rect = video.getBoundingClientRect()
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width
        canvas.height = rect.height
      }

      drawSkeletonOverlay(canvas, results, rect.width, rect.height)
    }

    // Real-time client-side environment check (fast, no API call)
    if (pageState === 'environment-check') {
      // Calculate lighting and hand visibility in real-time
      let lightingScore = 0
      let handVisibilityScore = 0
      let handCount = 0

      // Lighting: average visibility of all landmarks
      const allLandmarks = [
        ...(results.poseLandmarks || []),
        ...(results.leftHandLandmarks || []),
        ...(results.rightHandLandmarks || [])
      ]

      if (allLandmarks.length > 0) {
        lightingScore = allLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / allLandmarks.length
      }

      // Hand visibility: check if hands are detected
      if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
        const leftVis = results.leftHandLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / results.leftHandLandmarks.length
        handVisibilityScore += leftVis
        handCount++
      }
      if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
        const rightVis = results.rightHandLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / results.rightHandLandmarks.length
        handVisibilityScore += rightVis
        handCount++
      }

      if (handCount > 0) {
        handVisibilityScore = handVisibilityScore / handCount
      }

      // Update environment check state immediately (real-time)
      setEnvironmentCheck({
        lighting_quality: lightingScore,
        hand_visibility: handVisibilityScore,
        frame_completeness: allLandmarks.length > 0 ? 0.9 : 0,
        can_proceed: lightingScore >= 0.25 && handVisibilityScore >= 0.3,
        lighting_label: lightingScore >= 0.85 ? 'Excellent ☀️' : lightingScore >= 0.70 ? 'Good 💡' : lightingScore >= 0.55 ? 'Acceptable ⚠️' : lightingScore >= 0.25 ? 'Poor 🌙' : 'Too Dark 🌑',
        recommendations: lightingScore < 0.25
          ? ['⚠️ Lighting too dark - move to a brighter area', 'Turn on more lights or face a window']
          : handVisibilityScore < 0.3
          ? ['⚠️ Hands not clearly visible', 'Position hands in front of camera']
          : ['✓ Environment looks good! Ready to record']
      })
    }

    // Record frames during recording
    if (isRecordingRef.current) {
      const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000
      const frameNumber = frameCountRef.current++

      const frame: Frame = {
        frame_number: frameNumber,
        timestamp: elapsed,
        pose_landmarks: results.poseLandmarks || [],
        left_hand_landmarks: results.leftHandLandmarks,
        right_hand_landmarks: results.rightHandLandmarks,
        face_landmarks: results.faceLandmarks
      }

      setRecordedFrames((prev) => {
        if (prev.length === 0) {
          console.log('🔍 First frame structure:', {
            pose_landmarks_count: frame.pose_landmarks.length,
            pose_sample: frame.pose_landmarks[0],
            left_hand_count: frame.left_hand_landmarks?.length,
            right_hand_count: frame.right_hand_landmarks?.length
          })
        }
        return [...prev, frame]
      })

      // Stop after 4 seconds (increased from 3 to ensure minimum 30 frames)
      if (elapsed >= 4.0 && stopRecordingRef.current) {
        stopRecordingRef.current()
      }
    }
  }, [pageState]) // Only depend on pageState to fix stale closure bug

  const handleSignSelected = (word: string) => {
    setSelectedWord(word)
    setPageState('community')
  }
  const handleProceedToContribute = () => {
    setPageState('reference')
  }


  const handleReferenceReady = () => {
    setPageState('classification')
  }

  const handleClassificationComplete = (classification: {
    sign_type_movement: 'static' | 'dynamic'
    sign_type_hands: 'one-handed' | 'two-handed'
  }) => {
    setSignClassification(classification)
    // In test mode, skip environment check and go straight to recording
    setPageState(testMode ? 'recording' : 'environment-check')
  }

  const handleBackToReference = () => {
    setPageState('reference')
  }

  // Environment check handler
  // Environment check is now done in real-time in handleLandmarkResults (no API call needed)

  // Calculate current hand visibility from last 10 frames for real-time indicator
  const calculateCurrentHandVisibility = useCallback(() => {
    const lastFrames = recordedFrames.slice(-10) // Last 10 frames
    if (lastFrames.length === 0) return 0

    let totalVisibility = 0
    lastFrames.forEach(frame => {
      let leftVis = 0, rightVis = 0
      if (frame.left_hand_landmarks && frame.left_hand_landmarks.length > 0) {
        leftVis = frame.left_hand_landmarks.reduce((sum: number, lm: any) => sum + (lm.visibility || 0), 0) / frame.left_hand_landmarks.length
      }
      if (frame.right_hand_landmarks && frame.right_hand_landmarks.length > 0) {
        rightVis = frame.right_hand_landmarks.reduce((sum: number, lm: any) => sum + (lm.visibility || 0), 0) / frame.right_hand_landmarks.length
      }
      totalVisibility += Math.max(leftVis, rightVis)
    })

    return totalVisibility / lastFrames.length
  }, [recordedFrames])

  // Initialize MediaPipe when entering recording or environment-check state
  // IMPORTANT: Re-initialize when handleLandmarkResults changes to fix stale closure bug
  useEffect(() => {
    if ((pageState === 'recording' || pageState === 'environment-check') && webcamRef.current?.video) {
      // Dispose existing handler before creating new one
      if (mediaPipeHandlerRef.current) {
        console.log('🔄 Re-initializing MediaPipe with fresh callback')
        mediaPipeHandlerRef.current.dispose()
      }
      initializeMediaPipe()
    }

    return () => {
      if (mediaPipeHandlerRef.current) {
        mediaPipeHandlerRef.current.dispose()
      }
    }
  }, [pageState, handleLandmarkResults])

  const startCountdown = () => {
    setCountdown(5)

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          startRecording()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const startRecording = () => {
    setIsRecording(true); isRecordingRef.current = true
    setRecordedFrames([])
    recordingStartTimeRef.current = Date.now()
    frameCountRef.current = 0
    console.log('🔴 Recording started at', recordingStartTimeRef.current)
  }

  // Handle completion of an individual attempt (for 3-attempt loop)
  const handleAttemptComplete = useCallback(async () => {
    // In test mode, allow proceeding even with 0 frames
    if (!testMode && recordedFrames.length < 10) {
      toast.error(`Recording too short (${recordedFrames.length} frames). Please try again.`, { duration: 4000 })
      return
    }

    // Calculate quick quality estimate for this attempt (simplified client-side)
    const duration = recordedFrames.length > 0 ? (recordedFrames[recordedFrames.length - 1]?.timestamp || 0) : 3.0
    const avgVisibility = recordedFrames.length > 0
      ? recordedFrames.reduce((sum, frame) => {
          const poseVis = frame.pose_landmarks?.reduce((s, lm: any) => s + (lm.visibility || 0), 0) || 0
          return sum + poseVis / (frame.pose_landmarks?.length || 33)
        }, 0) / recordedFrames.length
      : 0.8  // Default quality for test mode

    const attemptQuality = Math.min(1.0, avgVisibility)

    // Store this attempt
    const newAttempt = {
      frames: [...recordedFrames],
      quality: attemptQuality,
      duration: duration
    }

    const newAttemptData = [...attemptData, newAttempt]
    setAttemptData(newAttemptData)

    console.log(`🔍 handleAttemptComplete: attempts=${newAttemptData.length}/${maxAttempts}, currentAttempt=${currentAttempt}`)

    // Check if we've completed all attempts (use attemptData.length, not currentAttempt)
    // because currentAttempt might be stale due to React's async state updates
    if (newAttemptData.length < maxAttempts) {
      // Show brief review and prompt for next attempt
      setShowAttemptReview(true)
      toast.success(`Attempt ${newAttemptData.length}/${maxAttempts} recorded! Quality: ${(attemptQuality * 100).toFixed(0)}%`, { duration: 3000 })

      // Auto-advance to next attempt after 2 seconds
      // In test mode, DON'T auto-advance - let test manually trigger next attempt via button click
      if (!testMode) {
        setTimeout(() => {
          setCurrentAttempt(currentAttempt + 1)
          setRecordedFrames([])
          setShowAttemptReview(false)
        }, 2000)
      }
      // In testMode: do nothing, just stay in showAttemptReview state
      // The button will handle incrementing when clicked
    } else {
      // All attempts complete - submit averaged/final contribution
      console.log(`✅ All ${newAttemptData.length} attempts complete!`)
      if (maxAttempts === 1) {
        // Single attempt mode (testing): go directly to review
        setPageState('review')
      } else {
        // Multi-attempt mode: submit averaged contribution
        console.log('📊 Averaging and submitting...')
        toast.success(`All ${maxAttempts} attempts complete! Averaging and submitting...`, { duration: 3000 })
        await submitAveragedContribution(newAttemptData)
        console.log('✅ Submission complete!')
      }
    }
  }, [recordedFrames, currentAttempt, attemptData, maxAttempts, testMode])

  const stopRecording = useCallback(() => {
    // Prevent duplicate calls (multiple timers might call this)
    if (!isRecordingRef.current) {
      console.log('⚠️ stopRecording called but already stopped, ignoring')
      return
    }

    setIsRecording(false); isRecordingRef.current = false
    setShowCompletionFlash(true)
    const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000
    console.log(`✓ Recording stopped after ${elapsed.toFixed(2)}s`)

    // Show completion flash for 500ms before handling attempt completion
    const handleCompletion = async () => {
      setShowCompletionFlash(false)
      await handleAttemptComplete()
    }

    // Always use setTimeout (even in testMode) so flash has time to render
    // Tests can use jest.advanceTimersByTime(500) to advance past the flash
    setTimeout(handleCompletion, 500)
  }, [handleAttemptComplete, testMode])

  // Keep stopRecording ref up-to-date for handleLandmarkResults callback
  useEffect(() => {
    stopRecordingRef.current = stopRecording
  }, [stopRecording])

  const submitAveragedContribution = async (attempts: Array<{ frames: Frame[], quality: number, duration: number }>) => {
    // Temporal alignment: Use the attempt with median frame count as reference
    const frameCounts = attempts.map(a => a.frames.length).sort((a, b) => a - b)
    const medianFrameCount = frameCounts[Math.floor(frameCounts.length / 2)]
    const referenceAttempt = attempts.find(a => a.frames.length === medianFrameCount) || attempts[0]
    const targetLength = referenceAttempt.frames.length

    // Resample all attempts to match target length (simple linear interpolation)
    const resampledAttempts = attempts.map(attempt => resampleFrames(attempt.frames, targetLength))

    // Average landmarks position-by-position across all 3 attempts
    const averagedFrames: Frame[] = []
    for (let frameIdx = 0; frameIdx < targetLength; frameIdx++) {
      const frames = resampledAttempts.map(a => a[frameIdx])

      // Average pose landmarks (33 points)
      const avgPoseLandmarks = averageLandmarks(frames.map(f => f.pose_landmarks), 33)

      // Average hand landmarks (21 points each)
      const leftHandFrames = frames.filter(f => f.left_hand_landmarks !== null)
      const avgLeftHand = leftHandFrames.length > 0
        ? averageLandmarks(leftHandFrames.map(f => f.left_hand_landmarks!), 21)
        : null

      const rightHandFrames = frames.filter(f => f.right_hand_landmarks !== null)
      const avgRightHand = rightHandFrames.length > 0
        ? averageLandmarks(rightHandFrames.map(f => f.right_hand_landmarks!), 21)
        : null

      averagedFrames.push({
        frame_number: frameIdx,
        timestamp: frames[0].timestamp, // Use first attempt's timing
        pose_landmarks: avgPoseLandmarks,
        left_hand_landmarks: avgLeftHand,
        right_hand_landmarks: avgRightHand,
        face_landmarks: null
      })
    }

    await submitContributionToBackend(averagedFrames, {
      num_attempts: 3,
      individual_qualities: attempts.map(a => a.quality),
      individual_durations: attempts.map(a => a.duration),
      quality_variance: calculateVariance(attempts.map(a => a.quality)),
      improvement_trend: determineImprovementTrend(attempts.map(a => a.quality))
    })
  }

  // Resample frames to target length using linear interpolation
  const resampleFrames = (frames: Frame[], targetLength: number): Frame[] => {
    if (frames.length === targetLength) return frames

    const ratio = (frames.length - 1) / (targetLength - 1)
    const resampled: Frame[] = []

    for (let i = 0; i < targetLength; i++) {
      const srcIdx = i * ratio
      const lowerIdx = Math.floor(srcIdx)
      const upperIdx = Math.min(Math.ceil(srcIdx), frames.length - 1)
      const weight = srcIdx - lowerIdx

      if (weight === 0) {
        // Exact match
        resampled.push({ ...frames[lowerIdx], frame_number: i })
      } else {
        // Interpolate between two frames
        const lowerFrame = frames[lowerIdx]
        const upperFrame = frames[upperIdx]

        resampled.push({
          frame_number: i,
          timestamp: lowerFrame.timestamp * (1 - weight) + upperFrame.timestamp * weight,
          pose_landmarks: interpolateLandmarks(lowerFrame.pose_landmarks, upperFrame.pose_landmarks, weight),
          left_hand_landmarks: (lowerFrame.left_hand_landmarks && upperFrame.left_hand_landmarks)
            ? interpolateLandmarks(lowerFrame.left_hand_landmarks, upperFrame.left_hand_landmarks, weight)
            : lowerFrame.left_hand_landmarks || upperFrame.left_hand_landmarks,
          right_hand_landmarks: (lowerFrame.right_hand_landmarks && upperFrame.right_hand_landmarks)
            ? interpolateLandmarks(lowerFrame.right_hand_landmarks, upperFrame.right_hand_landmarks, weight)
            : lowerFrame.right_hand_landmarks || upperFrame.right_hand_landmarks,
          face_landmarks: null
        })
      }
    }

    return resampled
  }

  // Interpolate between two landmark arrays
  const interpolateLandmarks = (lower: any[], upper: any[], weight: number): any[] => {
    return lower.map((lm, idx) => {
      const upperLm = upper[idx]
      return {
        x: lm.x * (1 - weight) + upperLm.x * weight,
        y: lm.y * (1 - weight) + upperLm.y * weight,
        z: lm.z * (1 - weight) + upperLm.z * weight,
        visibility: lm.visibility * (1 - weight) + (upperLm.visibility || lm.visibility) * weight
      }
    })
  }

  // Average landmarks across multiple attempts
  const averageLandmarks = (landmarkArrays: any[][], expectedCount: number): any[] => {
    const avgLandmarks: any[] = []

    for (let lmIdx = 0; lmIdx < expectedCount; lmIdx++) {
      let sumX = 0, sumY = 0, sumZ = 0, sumVis = 0, count = 0

      for (const landmarks of landmarkArrays) {
        if (landmarks && landmarks[lmIdx]) {
          const lm = landmarks[lmIdx]
          sumX += lm.x
          sumY += lm.y
          sumZ += lm.z
          sumVis += lm.visibility || 1.0
          count++
        }
      }

      avgLandmarks.push({
        x: count > 0 ? sumX / count : 0,
        y: count > 0 ? sumY / count : 0,
        z: count > 0 ? sumZ / count : 0,
        visibility: count > 0 ? sumVis / count : 0
      })
    }

    return avgLandmarks
  }

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  }

  const determineImprovementTrend = (qualities: number[]): string => {
    if (qualities.length < 2) return "Insufficient data"

    const first = qualities[0]
    const last = qualities[qualities.length - 1]
    const improvement = last - first

    if (improvement > 0.1) return "Consistently improving"
    if (improvement < -0.1) return "Declining"
    if (Math.max(...qualities) - Math.min(...qualities) < 0.05) return "Stable"
    return "Variable"
  }

  const submitContributionToBackend = async (frames: Frame[], attemptMetadata?: any) => {
    if (frames.length < 10) {
      toast.error(`Recording too short (${frames.length} frames). Please try again.`, { duration: 4000 })
      return
    }

    // Warn if frames are low but still allow submission
    if (frames.length < 30 && !attemptMetadata) {
      const proceed = confirm(`Recording has only ${frames.length} frames (recommended: 30+). Submit anyway?`)
      if (!proceed) {
        return
      }
    }

    try {
      // Helper to clamp values between 0 and 1
      const clamp = (val: number) => Math.max(0, Math.min(1, val))
      
      // Helper to normalize a landmark
      const normalizeLandmark = (lm: any) => ({
        x: clamp(lm.x),
        y: clamp(lm.y),
        z: lm.z,  // z is not bounded
        visibility: clamp(lm.visibility || 1.0)
      })

      // Validate and normalize frames for API
      const validatedFrames = frames.map((frame, idx) => {
        // Ensure pose_landmarks has exactly 33 items (pad with zeros if needed)
        const poseLandmarks = (frame.pose_landmarks || []).map(normalizeLandmark)
        const normalizedPose = poseLandmarks.slice(0, 33)
        while (normalizedPose.length < 33) {
          normalizedPose.push({ x: 0, y: 0, z: 0, visibility: 0 })
        }

        return {
          frame_number: idx,
          timestamp: frame.timestamp,
          pose_landmarks: normalizedPose,
          left_hand_landmarks: frame.left_hand_landmarks && frame.left_hand_landmarks.length === 21
            ? frame.left_hand_landmarks.map(normalizeLandmark)
            : null,
          right_hand_landmarks: frame.right_hand_landmarks && frame.right_hand_landmarks.length === 21
            ? frame.right_hand_landmarks.map(normalizeLandmark)
            : null,
          face_landmarks: null  // Not required
        }
      })

      const contribution = {
        word: selectedWord,
        user_id: userId,
        frames: validatedFrames,
        duration: frames[frames.length - 1]?.timestamp || 3.0,
        metadata: {
          browser: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        // User's sign classification (from classification questions)
        sign_type_movement: signClassification?.sign_type_movement || null,
        sign_type_hands: signClassification?.sign_type_hands || null,
        // 3-attempt metadata
        num_attempts: attemptMetadata?.num_attempts || 1,
        individual_qualities: attemptMetadata?.individual_qualities || null,
        individual_durations: attemptMetadata?.individual_durations || null,
        quality_variance: attemptMetadata?.quality_variance || null,
        improvement_trend: attemptMetadata?.improvement_trend || null
      }

      console.log('📤 Submitting contribution:', {
        word: contribution.word,
        user_id: contribution.user_id,
        frames: contribution.frames.length,
        duration: contribution.duration
      })
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contribution)
      })
      
      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ API error response:', error)

        // Capture quality breakdown from error response (if present)
        if (error.quality_breakdown) {
          setQualityBreakdown(error.quality_breakdown)
          console.log('✓ Quality breakdown from error:', error.quality_breakdown)
        }

        throw new Error(JSON.stringify(error.detail || error))
      }

      const result = await response.json()

      // Capture quality breakdown from response
      if (result.quality_breakdown) {
        setQualityBreakdown(result.quality_breakdown)
        console.log('✓ Quality breakdown received:', result.quality_breakdown)
      }

      setContributionStats({
        total: result.total_contributions,
        progress: result.progress_percentage
      })

      setPageState('success')
      setSelectorKey(k => k + 1) // Force SignSelector to re-fetch stats


    } catch (error: any) {
      console.error('Failed to submit contribution:', error)
      if (error.message) {
        console.error('Error details:', error.message)
      }
      // Parse quality score error if present
      if (error.message && error.message.includes('quality too low')) {
        const match = error.message.match(/quality too low: ([0-9.]+)/)
        const score = match ? parseFloat(match[1]) : null

        toast.error(
          (t) => (
            <div className="text-sm">
              <p className="font-bold mb-1">❌ Quality Too Low</p>
              <p className="mb-2">Score: <strong>{score ? (score * 100).toFixed(0) : '?'}%</strong> (minimum 50% required)</p>
              <p className="text-xs mb-2">Main issues:</p>
              <ul className="text-xs space-y-1 mb-2">
                <li>• Hands must stay visible (50% weight)</li>
                <li>• Smooth movements required (30% weight)</li>
                <li>• Complete body in frame (20% weight)</li>
              </ul>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-white text-red-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100"
              >
                Got it, I'll retake
              </button>
            </div>
          ),
          { duration: 10000, style: { maxWidth: '400px' } }
        )
      } else {
        toast.error(`Failed to submit: ${error.message || 'Unknown error'}`, { duration: 5000 })
      }
    }
  }

  // Main button handler - starts the 3-attempt loop
  const handleSubmitContribution = async () => {
    await handleAttemptComplete()
  }

  const handleRetake = () => {
    setRecordedFrames([])
    setCurrentAttempt(1)
    setAttemptData([])
    setPageState('recording')
  }

  const handleChooseDifferentSign = () => {
    setSelectedWord('')
    setRecordedFrames([])
    setSelectorKey(k => k + 1) // Force SignSelector to re-fetch updated stats
    setPageState('select')
  }

  // ===========================
  // RENDER BASED ON STATE
  // ===========================

  
  if (pageState === 'community') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleChooseDifferentSign}
              className="text-indigo-600 hover:text-indigo-800 font-medium mb-4"
            >
              ← Choose Different Sign
            </button>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {selectedWord.toUpperCase()}
            </h1>
            <p className="text-lg text-gray-600">
              Review community contributions and the averaged ground truth skeleton
            </p>
          </div>

          {/* Community Contributions */}
          <CommunityContributions word={selectedWord} />

          {/* Proceed to Contribute Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleProceedToContribute}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 text-lg"
            >
              ✨ Add Your Contribution
            </button>
            <p className="mt-3 text-sm text-gray-600">
              After reviewing, record your own version to help improve the ground truth
            </p>
          </div>
        </div>
      </div>
      </>
    )
  }

  if (pageState === 'select') {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <SignSelector key={selectorKey} onSelectSign={handleSignSelected} />
      </>
    )
  }

  if (pageState === 'reference') {
    // Use API to get the correct sign image path (trim to remove any whitespace/newlines)
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim()
    const signImageUrl = `${apiUrl}/sign_images/${selectedWord}.png`
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <ReferencePlayer
        word={selectedWord}
        signImageUrl={signImageUrl}
        onReady={handleReferenceReady}
      />
      </>
    )
  }

  if (pageState === 'classification') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <SignClassification
        word={selectedWord}
        onComplete={handleClassificationComplete}
        onBack={handleBackToReference}
      />
      </>
    )
  }

  if (pageState === 'environment-check') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Environment Check
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Checking your camera setup and lighting...
          </p>

          {/* Webcam Preview with Real-Time Overlay */}
          <div className="relative mb-6 bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'user',
                width: 1280,
                height: 720
              }}
              className="w-full"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

            {/* Real-time gauges overlaid on video */}
            {environmentCheck && (
              <div className="absolute top-4 left-4 right-4 space-y-3 z-10">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  {/* Lighting Gauge */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">💡 Lighting</span>
                      <span className="text-white text-sm font-bold">{Math.round(environmentCheck.lighting_quality * 100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          environmentCheck.lighting_quality >= 0.85 ? 'bg-green-500' :
                          environmentCheck.lighting_quality >= 0.70 ? 'bg-blue-500' :
                          environmentCheck.lighting_quality >= 0.55 ? 'bg-yellow-500' :
                          environmentCheck.lighting_quality >= 0.25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(environmentCheck.lighting_quality * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Hand Visibility Gauge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">✋ Hands Visible</span>
                      <span className="text-white text-sm font-bold">{Math.round(environmentCheck.hand_visibility * 100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          environmentCheck.hand_visibility >= 0.70 ? 'bg-green-500' :
                          environmentCheck.hand_visibility >= 0.30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(environmentCheck.hand_visibility * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="mt-3 text-center">
                    <span className={`text-sm font-semibold ${environmentCheck.can_proceed ? 'text-green-400' : 'text-red-400'}`}>
                      {environmentCheck.can_proceed ? '✓ Ready to Record!' : '⚠️ Improve conditions'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Large Prominent Action Button */}
          {environmentCheck && (
            <div className="space-y-4">
              {/* Recommendations if needed */}
              {!environmentCheck.can_proceed && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {environmentCheck.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                        <span className="mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPageState('classification')}
                  className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setPageState('recording')}
                  disabled={!environmentCheck.can_proceed}
                  className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                    environmentCheck.can_proceed
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {environmentCheck.can_proceed ? '🎥 Start Recording' : '⏸️ Waiting for Good Conditions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    )
  }

  if (pageState === 'recording' || pageState === 'review') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-black md:bg-gradient-to-br md:from-blue-50 md:to-indigo-100 md:p-6">
        <div className="h-screen md:h-auto md:max-w-5xl md:mx-auto flex flex-col">
          {/* Mobile: Compact Header Overlay | Desktop: Normal Header */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">
                  {selectedWord}
                </h1>
                <p className="text-xs text-white/80">Attempt {currentAttempt}/3</p>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-bold">{recordingElapsed.toFixed(1)}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Recording: <span className="text-indigo-600">{selectedWord}</span>
            </h1>
            <p className="text-sm text-gray-600 mb-2">Attempt {currentAttempt} of 3</p>
            {isRecording && (
              <RecordingFeedback
                recordingElapsed={recordingElapsed}
                recordingProgress={recordingProgress}
                showCompletionFlash={false}
                onStopRecording={stopRecording}
              />
            )}
          </div>

          {/* Real-Time Quality Indicators - Desktop Only */}
          {pageState === 'recording' && isRecording && (
            <div className="hidden md:block absolute top-24 right-6 z-30 space-y-3 max-w-xs">
              <HandVisibilityIndicator
                handVisibility={calculateCurrentHandVisibility()}
                showPercentage={true}
              />
            </div>
          )}

          {/* Completion Flash */}
          {showCompletionFlash && (
            <div className="fixed inset-0 flex items-center justify-center bg-green-500 bg-opacity-90 z-50">
              <div className="text-4xl md:text-6xl font-bold text-white animate-pulse">
                ✓ DONE!
              </div>
            </div>
          )}

          {/* Video + Canvas Container - Full Screen on Mobile */}
          <div className="relative flex-1 md:flex-none bg-black md:rounded-2xl overflow-hidden md:shadow-2xl md:mb-6 md:aspect-video">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: 'user'
              }}
              className="w-full h-full object-cover"
            />

            {/* Skeleton Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ imageRendering: 'auto' }}
            />

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                <div className="text-white text-8xl md:text-9xl font-bold animate-pulse drop-shadow-2xl">
                  {countdown}
                </div>
              </div>
            )}

            {/* Mobile Recording Progress Bar */}
            {isRecording && (
              <div className="md:hidden absolute bottom-0 left-0 right-0 h-2 bg-black/30">
                <div
                  className="h-full bg-red-600 transition-all duration-100"
                  style={{ width: `${recordingProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Controls - Bottom on Mobile, Normal on Desktop */}
          {pageState === 'recording' && !isRecording && countdown === null && !showAttemptReview && (
            <div className="absolute md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-gradient-to-t from-black/90 to-transparent md:bg-transparent p-6 md:p-0 md:text-center">
              <button
                onClick={startCountdown}
                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full md:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-2xl text-lg md:text-xl flex items-center justify-center gap-3"
              >
                <span className="text-2xl">⏺</span>
                <span>Start Recording</span>
              </button>
              <p className="mt-3 text-sm text-white/80 md:text-gray-600 text-center">
                Position yourself clearly in frame
              </p>
            </div>
          )}

          {/* Attempt Review - Show button to start next attempt (in test mode or after review delay) */}
          {pageState === 'recording' && !isRecording && countdown === null && showAttemptReview && currentAttempt < maxAttempts && (
            <div className="absolute md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-gradient-to-t from-black/90 to-transparent md:bg-transparent p-6 md:p-0 md:text-center">
              <button
                onClick={() => {
                  // Increment to next attempt and start recording
                  setCurrentAttempt(currentAttempt + 1)
                  setRecordedFrames([])
                  setShowAttemptReview(false)
                  startCountdown()
                }}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full md:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-2xl text-lg md:text-xl flex items-center justify-center gap-3"
              >
                <span className="text-2xl">⏺</span>
                <span>Start Recording (Attempt {currentAttempt + 1}/{maxAttempts})</span>
              </button>
              <p className="mt-3 text-sm text-white/80 md:text-gray-600 text-center">
                Previous attempt recorded. Ready for next attempt?
              </p>
            </div>
          )}

          {pageState === 'review' && (
            <div className="md:space-y-4 md:px-0">
              {/* Mobile: Slide-up Panel | Desktop: Normal Card */}
              <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-white rounded-t-3xl md:rounded-xl p-6 md:p-6 shadow-2xl md:shadow-lg max-h-[75vh] md:max-h-none overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden"></div>

                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  Review Your Recording
                </h2>

                {/* Stats Pills */}
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 bg-indigo-50 rounded-lg p-3">
                    <div className="text-xs text-indigo-600 font-medium">FRAMES</div>
                    <div className="text-xl font-bold text-indigo-900">{recordedFrames.length}</div>
                  </div>
                  <div className="flex-1 bg-indigo-50 rounded-lg p-3">
                    <div className="text-xs text-indigo-600 font-medium">DURATION</div>
                    <div className="text-xl font-bold text-indigo-900">
                      {recordedFrames[recordedFrames.length - 1]?.timestamp.toFixed(1) || 0}s
                    </div>
                  </div>
                </div>

                {/* Skeleton Preview */}
                <div className="mb-5">
                  <SkeletonPreview
                    frames={recordedFrames}
                    isPlaying={isPlayingPreview}
                    onPlaybackComplete={() => setIsPlayingPreview(false)}
                  />
                  <button
                    onClick={() => setIsPlayingPreview(true)}
                    className="mt-3 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>▶</span>
                    <span>Play Preview</span>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-5 text-center md:text-left">
                  Were your hands clearly visible throughout?
                </p>

                {/* Quality Breakdown - Show if quality is low or if submission failed */}
                {qualityBreakdown && qualityBreakdown.overall_score < 0.5 && (
                  <div className="mb-5">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">
                        ⚠️ Quality Too Low (Minimum 50% Required)
                      </h3>
                      <p className="text-sm text-orange-700">
                        Your recording quality is below the minimum threshold. Please review the issues below and try again.
                      </p>
                    </div>
                    <QualityScoreBreakdown
                      breakdown={qualityBreakdown}
                      signType={signClassification ? `${signClassification.sign_type_movement}, ${signClassification.sign_type_hands}` : undefined}
                      showRecommendations={true}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSubmitContribution}
                    className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    <span>Looks Good - Submit</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleRetake}
                      className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>↻</span>
                      <span>Retake</span>
                    </button>
                    <button
                      onClick={handleChooseDifferentSign}
                      className="bg-indigo-100 hover:bg-indigo-200 active:scale-95 text-indigo-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>←</span>
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    )
  }

  if (pageState === 'success') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 text-center">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🎉</div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Thank You!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
            Your contribution has been submitted successfully
          </p>

          {/* Quality Score Breakdown */}
          {qualityBreakdown && (
            <div className="mb-6 sm:mb-8 text-left">
              <QualityScoreBreakdown
                breakdown={qualityBreakdown}
                signType={signClassification ? `${signClassification.sign_type_movement}, ${signClassification.sign_type_hands}` : undefined}
                showRecommendations={qualityBreakdown.overall_score < 0.7}
              />
            </div>
          )}

          <div className="bg-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">
              {contributionStats.total}
            </div>
            <div className="text-sm sm:text-base text-gray-700">
              Total contributions for <strong>{selectedWord}</strong>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mt-3 sm:mt-4">
              <div
                className="bg-indigo-600 h-3 sm:h-4 rounded-full transition-all duration-500"
                style={{ width: `${contributionStats.progress}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-2">
              {contributionStats.progress.toFixed(0)}% complete
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Choose what to do next:
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setRecordedFrames([])
                setPageState('recording')
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🎥 Record Another {selectedWord}
            </button>
            <button
              onClick={handleChooseDifferentSign}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              📋 Choose Different Sign
            </button>
          </div>
        </div>
      </div>
      </>
    )
  }

  return null
}
