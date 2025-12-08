'use client'

import React from 'react'

interface QualityBreakdown {
  overall_score: number
  hand_visibility: number
  motion_smoothness: number
  frame_completeness: number
  lighting_quality: number
  components?: {
    overall: string
    hand_visibility: string
    motion_smoothness: string
    frame_completeness: string
    lighting: string
  }
  recommendations?: string[]
}

interface QualityScoreBreakdownProps {
  breakdown: QualityBreakdown
  signType?: string
  showRecommendations?: boolean
}

export default function QualityScoreBreakdown({
  breakdown,
  signType,
  showRecommendations = true
}: QualityScoreBreakdownProps) {
  // Helper to get color class based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-600'
    if (score >= 0.70) return 'text-blue-600'
    if (score >= 0.55) return 'text-yellow-600'
    if (score >= 0.40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Helper to get label from score
  const getScoreLabel = (score: number): string => {
    if (score >= 0.85) return 'Excellent'
    if (score >= 0.70) return 'Good'
    if (score >= 0.55) return 'Fair'
    if (score >= 0.40) return 'Needs Improvement'
    return 'Poor'
  }

  // Generate components if not provided
  const components = breakdown.components || {
    overall: getScoreLabel(breakdown.overall_score),
    hand_visibility: getScoreLabel(breakdown.hand_visibility),
    motion_smoothness: getScoreLabel(breakdown.motion_smoothness),
    frame_completeness: getScoreLabel(breakdown.frame_completeness),
    lighting: getScoreLabel(breakdown.lighting_quality)
  }

  // Generate recommendations if not provided
  const recommendations = breakdown.recommendations || (() => {
    const recs: string[] = []
    if (breakdown.hand_visibility < 0.7) recs.push('Ensure hands are clearly visible in frame')
    if (breakdown.motion_smoothness < 0.7) recs.push('Make smoother, more controlled movements')
    if (breakdown.frame_completeness < 0.7) recs.push('Keep hands in frame throughout the sign')
    if (breakdown.lighting_quality < 0.7) recs.push('Improve lighting conditions')
    if (recs.length === 0) recs.push('Great job! Your video quality is excellent.')
    return recs
  })()

  const getBackgroundColor = (score: number) => {
    if (score >= 0.85) return 'bg-green-50'
    if (score >= 0.70) return 'bg-blue-50'
    if (score >= 0.55) return 'bg-yellow-50'
    if (score >= 0.40) return 'bg-orange-50'
    return 'bg-red-50'
  }

  const getProgressColor = (score: number) => {
    if (score >= 0.85) return 'bg-green-500'
    if (score >= 0.70) return 'bg-blue-500'
    if (score >= 0.55) return 'bg-yellow-500'
    if (score >= 0.40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Component score item
  const ScoreItem = ({ label, score, component }: { label: string; score: number; component: string }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {Math.round(score * 100)}% {component}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor(score)} transition-all duration-500 ease-out`}
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Overall Score */}
      <div className={`rounded-lg p-4 mb-6 ${getBackgroundColor(breakdown.overall_score)}`}>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700 mb-1">Overall Quality Score</div>
          <div className={`text-4xl font-bold ${getScoreColor(breakdown.overall_score)}`}>
            {Math.round(breakdown.overall_score * 100)}%
          </div>
          <div className={`text-sm font-medium mt-1 ${getScoreColor(breakdown.overall_score)}`}>
            {components.overall}
          </div>
          {signType && (
            <div className="text-xs text-gray-600 mt-2">
              Sign Type: {signType}
            </div>
          )}
        </div>
      </div>

      {/* Component Scores */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Breakdown</h3>

        <ScoreItem
          label="✋ Hand Visibility"
          score={breakdown.hand_visibility}
          component={components.hand_visibility}
        />

        <ScoreItem
          label="〰️ Motion Smoothness"
          score={breakdown.motion_smoothness}
          component={components.motion_smoothness}
        />

        <ScoreItem
          label="📐 Frame Completeness"
          score={breakdown.frame_completeness}
          component={components.frame_completeness}
        />

        <ScoreItem
          label="💡 Lighting Quality"
          score={breakdown.lighting_quality}
          component={components.lighting}
        />
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            {breakdown.overall_score >= 0.7 ? '✓ Great Job!' : '💡 Recommendations'}
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
