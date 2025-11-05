'use client'

import React from 'react'

interface LightingQualityMeterProps {
  lightingQuality: number  // 0.0 - 1.0
  label?: string
  showPercentage?: boolean
}

export default function LightingQualityMeter({
  lightingQuality,
  label,
  showPercentage = true
}: LightingQualityMeterProps) {
  // Determine lighting status
  const getStatus = () => {
    if (lightingQuality >= 0.85) return { color: 'green', text: 'Excellent', icon: '☀️' }
    if (lightingQuality >= 0.70) return { color: 'blue', text: 'Good', icon: '💡' }
    if (lightingQuality >= 0.55) return { color: 'yellow', text: 'Acceptable', icon: '⚠️' }
    if (lightingQuality >= 0.40) return { color: 'orange', text: 'Poor', icon: '🌙' }
    if (lightingQuality >= 0.25) return { color: 'red', text: 'Very Poor', icon: '🌑' }
    return { color: 'red', text: 'Too Dark', icon: '✗' }
  }

  const status = getStatus()
  const percentage = Math.round(lightingQuality * 100)

  // Color mapping for the meter fill
  const getColorClass = () => {
    if (status.color === 'green') return 'bg-green-500'
    if (status.color === 'blue') return 'bg-blue-500'
    if (status.color === 'yellow') return 'bg-yellow-500'
    if (status.color === 'orange') return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <span className="text-2xl">{status.icon}</span>

      {/* Meter */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Lighting'}
          </span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {percentage}%
            </span>
          )}
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColorClass()} transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-600">
          {status.text}
        </div>
      </div>
    </div>
  )
}
