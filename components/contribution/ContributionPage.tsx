'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Webcam from 'react-webcam'
import { MediaPipeHandler, LandmarkResult, drawSkeletonOverlay } from './MediaPipeHandler'
import ReferencePlayer from './ReferencePlayer'
import SignSelector from './SignSelector'
import RecordingFeedback from './RecordingFeedback'
import SkeletonPreview from './SkeletonPreview'
import CommunityContributions from './CommunityContributions'
import QualityFeedback from './QualityFeedback'

type PageState = 'select' | 'community' | 'reference' | 'recording' | 'review' | 'success'

interface Frame {
  frame_number: number
  timestamp: number
  pose_landmarks: any[]
  left_hand_landmarks: any[] | null
  right_hand_landmarks: any[] | null
  face_landmarks: any[] | null
}

export default function ContributionPage() {
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

  // Initialize MediaPipe when entering recording state
  useEffect(() => {
    if (pageState === 'recording' && webcamRef.current?.video) {
      initializeMediaPipe()
    }

    return () => {
      if (mediaPipeHandlerRef.current) {
        mediaPipeHandlerRef.current.dispose()
      }
    }
  }, [pageState])

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
        setRecordingProgress((elapsed / 3.0) * 100)
        
        if (elapsed >= 3.5) {
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

  const handleLandmarkResults = (results: LandmarkResult) => {
    console.log('📸 handleLandmarkResults called, isRecording:', isRecordingRef.current)
    
    // Draw skeleton overlay
    if (canvasRef.current && webcamRef.current?.video) {
      const video = webcamRef.current.video
      drawSkeletonOverlay(canvasRef.current, results, video.videoWidth, video.videoHeight)
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

      // Stop after 2 seconds (60 frames @ 30fps)
      if (elapsed >= 3.0) {
        stopRecording()
      }
    }
  }

  const handleSignSelected = (word: string) => {
    setSelectedWord(word)
    setPageState('community')
  }
  const handleProceedToContribute = () => {
    setPageState('reference')
  }


  const handleReferenceReady = () => {
    setPageState('recording')
  }

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

  const stopRecording = useCallback(() => {
    setIsRecording(false); isRecordingRef.current = false
    setShowCompletionFlash(true)
    const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000
    console.log(`✓ Recording stopped after ${elapsed.toFixed(2)}s`)

    // Show completion flash for 500ms before transitioning
    setTimeout(() => {
      setShowCompletionFlash(false)
      setPageState('review')
    }, 500)
  }, [])

  const handleSubmitContribution = async () => {
    if (recordedFrames.length < 10) {
      toast.error(`Recording too short (${recordedFrames.length} frames). Please try again.`, { duration: 4000 })
      return
    }

    // Warn if frames are low but still allow submission
    if (recordedFrames.length < 30) {
      const proceed = confirm(`Recording has only ${recordedFrames.length} frames (recommended: 30+). Submit anyway?`)
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
      const validatedFrames = recordedFrames.map((frame, idx) => {
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
        duration: recordedFrames[recordedFrames.length - 1]?.timestamp || 3.0,
        metadata: {
          browser: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
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
        throw new Error(JSON.stringify(error.detail || error))
      }

      const result = await response.json()

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

  const handleRetake = () => {
    setRecordedFrames([])
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

  if (pageState === 'recording' || pageState === 'review') {
    return (
      <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-black md:bg-gradient-to-br md:from-blue-50 md:to-indigo-100 md:p-6">
        <div className="h-screen md:h-auto md:max-w-5xl md:mx-auto flex flex-col">
          {/* Mobile: Compact Header Overlay | Desktop: Normal Header */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white">
                {selectedWord}
              </h1>
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
            {isRecording && (
              <RecordingFeedback
                recordingElapsed={recordingElapsed}
                recordingProgress={recordingProgress}
                showCompletionFlash={false}
                onStopRecording={stopRecording}
              />
            )}
          </div>

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
              width={1280}
              height={720}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
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
          {pageState === 'recording' && !isRecording && countdown === null && (
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
