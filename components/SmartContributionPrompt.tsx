'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SmartContributionPromptProps {
  word: string
  confidence: number
}

interface ContributionStats {
  total: number
  hasAverage: boolean
}

export default function SmartContributionPrompt({ word, confidence }: SmartContributionPromptProps) {
  const [stats, setStats] = useState<ContributionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContributionStats()
  }, [word])

  const fetchContributionStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:9000/api/contributions/${word}?limit=1`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          total: data.total || 0,
          hasAverage: data.total > 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch contribution stats:', err)
      setStats({ total: 0, hasAverage: false })
    } finally {
      setLoading(false)
    }
  }

  // Don't show prompt if loading or high confidence with contributions
  if (loading) return null
  if (confidence >= 0.7 && stats && stats.total > 0) return null

  // Determine prompt level based on confidence and contributions
  const getPromptLevel = () => {
    // CRITICAL: Low confidence (<50%) and no contributions
    if (confidence < 0.5 && (!stats || stats.total === 0)) {
      return 'critical'
    }
    // IMPORTANT: Medium confidence (50-70%) and no/few contributions
    if (confidence < 0.7 && (!stats || stats.total < 3)) {
      return 'important'
    }
    // HELPFUL: High confidence but no community validation
    if (!stats || stats.total === 0) {
      return 'helpful'
    }
    return null
  }

  const promptLevel = getPromptLevel()
  if (!promptLevel) return null

  const prompts = {
    critical: {
      icon: '⚠️',
      title: 'Help Needed: Uncertain Match',
      description: `This sign was matched with only ${(confidence * 100).toFixed(0)}% confidence. The illustration might not accurately represent "${word.toUpperCase()}". Your contribution will help create a more accurate reference!`,
      bgColor: 'from-red-50 to-orange-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-900',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      badgeColor: 'bg-red-100 text-red-800',
      urgency: 'Critical'
    },
    important: {
      icon: '💡',
      title: 'Improve This Sign',
      description: stats && stats.total > 0
        ? `Only ${stats.total} contribution${stats.total !== 1 ? 's' : ''} so far. Add your recording to help build a stronger community reference!`
        : `This match has ${(confidence * 100).toFixed(0)}% confidence. No community contributions yet. Be the first to help validate this sign!`,
      bgColor: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-900',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      urgency: 'Important'
    },
    helpful: {
      icon: '🤝',
      title: 'Help Build Community Reference',
      description: 'No community contributions yet. Record yourself signing this to help others learn the correct form!',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-900',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      urgency: 'Helpful'
    }
  }

  const prompt = prompts[promptLevel]

  return (
    <div className={`mt-4 rounded-lg border-2 ${prompt.borderColor} bg-gradient-to-br ${prompt.bgColor} p-4 shadow-md`}>
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${prompt.badgeColor}`}>
          {prompt.icon} {prompt.urgency}
        </span>
        {stats && stats.total > 0 && (
          <span className="text-xs text-gray-600 font-medium">
            {stats.total} contribution{stats.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`text-base font-bold ${prompt.textColor} mb-2`}>
        {prompt.title}
      </h3>

      {/* Description */}
      <p className={`text-sm ${prompt.textColor} mb-4 leading-relaxed`}>
        {prompt.description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={`/contribute?preselect=${encodeURIComponent(word)}`}
          className={`flex-1 ${prompt.buttonColor} text-white font-semibold py-3 px-4 rounded-lg transition-all text-center shadow-md hover:shadow-lg`}
        >
          🎥 Record Your Version
        </Link>
        {stats && stats.hasAverage && (
          <Link
            href={`/contribute?preselect=${encodeURIComponent(word)}`}
            className="flex-1 bg-white text-gray-700 border-2 border-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all text-center"
          >
            👥 View Community Versions
          </Link>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Your 2-second recording helps 500,000+ deaf children learn accurate signs
        </p>
      </div>
    </div>
  )
}
