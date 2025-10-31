'use client'

import { useEffect, useState } from 'react'
import SkeletonPreview from './SkeletonPreview'

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

interface Contribution {
  id: number
  contribution_id: string
  user_id: string | null
  num_frames: number
  duration: number
  quality_score: number
  created_at: string
  frames: Frame[]  // API returns 'frames', not 'frames_data'
}

interface CommunityContributionsProps {
  word: string
}

export default function CommunityContributions({ word }: CommunityContributionsProps) {
  const [averageFrames, setAverageFrames] = useState<Frame[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingAverage, setPlayingAverage] = useState(false)
  const [playingContribution, setPlayingContribution] = useState<string | null>(null)

  useEffect(() => {
    fetchCommunityData()
  }, [word])

  const fetchCommunityData = async () => {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000').trim()

    try {
      setLoading(true)
      setError(null)

      // Fetch average skeleton
      const avgResponse = await fetch(`${API_URL}/api/contributions/${word}/average`)
      if (avgResponse.ok) {
        const avgData = await avgResponse.json()
        setAverageFrames(avgData.average_frames || [])
      }

      // Fetch individual contributions
      const contribResponse = await fetch(`${API_URL}/api/contributions/${word}?limit=20`)
      if (contribResponse.ok) {
        const contribData = await contribResponse.json()
        setContributions(contribData.contributions || [])
      }
    } catch (err) {
      console.error('Error fetching community data:', err)
      setError('Failed to load community contributions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getQualityBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800'
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading community contributions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCommunityData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (contributions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Community Contributions</h2>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No contributions yet for "{word.toUpperCase()}"</p>
          <p className="text-sm text-gray-500">Be the first to contribute!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Average Skeleton - Most Prominent */}
      {averageFrames.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Community Average: {word.toUpperCase()}
              </h2>
              <p className="text-sm text-gray-600">
                Ground truth skeleton averaged from {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setPlayingAverage(!playingAverage)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all"
            >
              {playingAverage ? '⏸ Pause' : '▶ Play Average'}
            </button>
          </div>

          <div className="bg-white rounded-lg p-4">
            <SkeletonPreview
              frames={averageFrames}
              isPlaying={playingAverage}
              onPlaybackComplete={() => setPlayingAverage(false)}
            />
          </div>
        </div>
      )}

      {/* Individual Contributions Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Individual Contributions ({contributions.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributions.map((contrib) => (
            <div
              key={contrib.contribution_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Contribution Info */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getQualityBadgeColor(contrib.quality_score)}`}>
                  {(contrib.quality_score * 100).toFixed(0)}% Quality
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(contrib.created_at)}
                </span>
              </div>

              {/* Skeleton Preview */}
              <div className="mb-3">
                {contrib.frames && contrib.frames.length > 0 ? (
                  <SkeletonPreview
                    frames={contrib.frames}
                    isPlaying={playingContribution === contrib.contribution_id}
                    onPlaybackComplete={() => setPlayingContribution(null)}
                  />
                ) : (
                  <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                    <p className="text-gray-400 text-sm">No preview available</p>
                  </div>
                )}
              </div>

              {/* Play Button */}
              <button
                onClick={() => {
                  if (playingContribution === contrib.contribution_id) {
                    setPlayingContribution(null)
                  } else {
                    setPlayingContribution(contrib.contribution_id)
                  }
                }}
                disabled={!contrib.frames || contrib.frames.length === 0}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {playingContribution === contrib.contribution_id ? '⏸ Pause' : '▶ Play'}
              </button>

              {/* Metadata */}
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Frames:</span>
                  <span className="font-medium">{contrib.num_frames}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{contrib.duration.toFixed(2)}s</span>
                </div>
                {contrib.user_id && (
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-medium truncate ml-2">{contrib.user_id}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
