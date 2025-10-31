'use client'

interface Frame {
  frame_number: number
  timestamp: number
  pose_landmarks: any[]
  left_hand_landmarks: any[] | null
  right_hand_landmarks: any[] | null
  face_landmarks: any[] | null
}

interface QualityFeedbackProps {
  frames: Frame[]
}

export default function QualityFeedback({ frames }: QualityFeedbackProps) {
  if (frames.length === 0) {
    return null
  }

  // Calculate quality metrics (same as backend)
  const calculateQuality = () => {
    // 1. Hand Visibility Score (50%)
    let handVisibilityScores: number[] = []
    for (const frame of frames) {
      let visibleHands = 0

      if (frame.left_hand_landmarks && frame.left_hand_landmarks.length === 21) {
        const avgVisibility = frame.left_hand_landmarks.reduce((sum: number, lm: any) =>
          sum + (lm.visibility || 1.0), 0) / 21
        if (avgVisibility > 0.5) visibleHands += 1
      }

      if (frame.right_hand_landmarks && frame.right_hand_landmarks.length === 21) {
        const avgVisibility = frame.right_hand_landmarks.reduce((sum: number, lm: any) =>
          sum + (lm.visibility || 1.0), 0) / 21
        if (avgVisibility > 0.5) visibleHands += 1
      }

      handVisibilityScores.push(visibleHands / 2.0)
    }
    const handVisibility = handVisibilityScores.reduce((a, b) => a + b, 0) / handVisibilityScores.length

    // 2. Frame Completeness Score (20%)
    let completenessScores: number[] = []
    for (const frame of frames) {
      const hasPose = frame.pose_landmarks?.length === 33
      const hasLeftHand = frame.left_hand_landmarks?.length === 21
      const hasRightHand = frame.right_hand_landmarks?.length === 21

      const completeness = (Number(hasPose) + Number(hasLeftHand) + Number(hasRightHand)) / 3.0
      completenessScores.push(completeness)
    }
    const completeness = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length

    // 3. Motion Smoothness (30%) - simplified version
    let smoothnessScores: number[] = []
    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1]
      const curr = frames[i]

      if (prev.pose_landmarks?.length >= 16 && curr.pose_landmarks?.length >= 16) {
        const leftWristPrev = prev.pose_landmarks[15]
        const leftWristCurr = curr.pose_landmarks[15]

        const distance = Math.sqrt(
          Math.pow(leftWristCurr.x - leftWristPrev.x, 2) +
          Math.pow(leftWristCurr.y - leftWristPrev.y, 2) +
          Math.pow(leftWristCurr.z - leftWristPrev.z, 2)
        )

        const smoothness = Math.max(0.0, 1.0 - (distance / 0.1))
        smoothnessScores.push(smoothness)
      }
    }
    const smoothness = smoothnessScores.length > 0
      ? smoothnessScores.reduce((a, b) => a + b, 0) / smoothnessScores.length
      : 1.0

    // Weighted average (same as backend)
    const qualityScore = (
      handVisibility * 0.50 +
      smoothness * 0.30 +
      completeness * 0.20
    )

    return {
      overall: qualityScore,
      handVisibility,
      smoothness,
      completeness
    }
  }

  const quality = calculateQuality()
  const overallPercent = (quality.overall * 100).toFixed(0)

  const getQualityColor = (score: number) => {
    if (score >= 0.7) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
    if (score >= 0.5) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' }
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  }

  const colors = getQualityColor(quality.overall)
  const willPass = quality.overall >= 0.5

  return (
    <div className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
      {/* Overall Score */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-700">Quality Score:</span>
        <span className={`text-2xl font-bold ${colors.text}`}>
          {overallPercent}%
        </span>
      </div>

      {/* Status */}
      {willPass ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-green-800 font-medium text-sm">
            ✓ Great! This recording will be accepted (minimum 50% required)
          </p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-red-800 font-bold text-sm mb-2">
            ⚠️ Quality too low - Recording will be rejected (minimum 50% required)
          </p>
          <p className="text-red-700 text-xs">
            Please retake and ensure both hands stay clearly visible throughout the recording
          </p>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">👐 Hand Visibility (50%):</span>
          <span className={`font-semibold ${quality.handVisibility >= 0.7 ? 'text-green-700' : quality.handVisibility >= 0.5 ? 'text-yellow-700' : 'text-red-700'}`}>
            {(quality.handVisibility * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">📊 Frame Completeness (20%):</span>
          <span className={`font-semibold ${quality.completeness >= 0.7 ? 'text-green-700' : quality.completeness >= 0.5 ? 'text-yellow-700' : 'text-red-700'}`}>
            {(quality.completeness * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">🎯 Motion Smoothness (30%):</span>
          <span className={`font-semibold ${quality.smoothness >= 0.7 ? 'text-green-700' : quality.smoothness >= 0.5 ? 'text-yellow-700' : 'text-red-700'}`}>
            {(quality.smoothness * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Tips for improvement */}
      {!willPass && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs font-semibold text-gray-700 mb-2">Tips to improve quality:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {quality.handVisibility < 0.5 && (
              <li>• Keep both hands in frame and clearly visible</li>
            )}
            {quality.completeness < 0.7 && (
              <li>• Ensure your whole body is visible in the frame</li>
            )}
            {quality.smoothness < 0.7 && (
              <li>• Make smooth, steady movements - avoid jerky motions</li>
            )}
            <li>• Use good lighting so MediaPipe can detect landmarks</li>
            <li>• Position yourself 1-2 meters from the camera</li>
          </ul>
        </div>
      )}
    </div>
  )
}
