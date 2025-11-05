'use client'

import React from 'react'

interface HandVisibilityIndicatorProps {
  handVisibility: number  // 0.0 - 1.0
  showPercentage?: boolean
}

export default function HandVisibilityIndicator({
  handVisibility,
  showPercentage = true
}: HandVisibilityIndicatorProps) {
  // Determine status
  const getStatus = () => {
    if (handVisibility >= 0.85) return { color: 'green', text: 'Excellent', icon: '👐✓' }
    if (handVisibility >= 0.70) return { color: 'blue', text: 'Good', icon: '👐' }
    if (handVisibility >= 0.55) return { color: 'yellow', text: 'Acceptable', icon: '✋⚠️' }
    if (handVisibility >= 0.40) return { color: 'orange', text: 'Poor', icon: '✋⚠️' }
    return { color: 'red', text: 'Not Visible', icon: '✋✗' }
  }

  const status = getStatus()
  const percentage = Math.round(handVisibility * 100)

  // Color mapping
  const getColorClass = () => {
    if (status.color === 'green') return 'bg-green-500'
    if (status.color === 'blue') return 'bg-blue-500'
    if (status.color === 'yellow') return 'bg-yellow-500'
    if (status.color === 'orange') return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getBorderClass = () => {
    if (status.color === 'green') return 'border-green-500'
    if (status.color === 'blue') return 'border-blue-500'
    if (status.color === 'yellow') return 'border-yellow-500'
    if (status.color === 'orange') return 'border-orange-500'
    return 'border-red-500'
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg ${getBorderClass()} bg-white/10 backdrop-blur-sm`}>
      {/* Icon */}
      <span className="text-xl">{status.icon}</span>

      {/* Status */}
      <div className="flex-1">
        <div className="text-sm font-medium text-white">
          Hands: {status.text}
        </div>
        {showPercentage && (
          <div className="text-xs text-white/80">
            {percentage}% visible
          </div>
        )}
      </div>

      {/* Visual indicator */}
      <div className={`w-3 h-3 rounded-full ${getColorClass()} animate-pulse`} />
    </div>
  )
}
