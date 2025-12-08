'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Activity, Users, TrendingUp, Award, Database, Download, RefreshCw, BarChart3, Eye, Trash2, Edit2, X, Lock, Unlock, Search, Sparkles, Play, Pause, Video, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import VideoPlayer from '../../components/VideoPlayer'
import SkeletonVisualizer from '../../components/SkeletonVisualizer'
import ContributionPreviewModal from '../../components/admin/ContributionPreviewModal'

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

/**
 * Admin-authenticated fetch helper
 * Automatically adds X-Admin-User-Id header
 */
async function adminFetch(url: string, userEmail: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  headers.set('X-Admin-User-Id', userEmail)
  return fetch(url, { ...options, headers })
}

// Types
interface SystemOverview {
  total_words: number
  total_contributions: number
  unique_contributors: number
  average_quality_score: number
  words_ready_for_training: number
  total_frames_collected: number
  total_data_points: number
  storage_size_mb: number
  uptime_hours: number
  last_contribution_time: string | null
  system_health: string
}

interface WordStats {
  word: string
  total_contributions: number
  unique_contributors: number
  average_quality: number
  min_quality: number
  max_quality: number
  average_duration: number
  average_fps: number
  total_frames: number
  ready_for_training: boolean
  contributions_needed: number
  last_contribution: string
  is_open_for_contribution?: boolean
}

interface DailyStats {
  date: string
  contributions: number
  average_quality: number
  unique_words: number
  unique_users: number
}

interface LeaderboardEntry {
  user_id: string
  total_contributions: number
  average_quality: number
  total_frames: number
  consistency_score: number
  words: string[]
}

interface QualityReport {
  total_contributions: number
  high_quality_count: number
  medium_quality_count: number
  low_quality_count: number
  average_quality: number
  quality_distribution: Record<string, number>
  fps_distribution: Record<string, number>
  hand_detection_rate: number
  average_frames_per_contribution: number
  data_completeness_score: number
}

interface Contribution {
  id: number
  contribution_id: string
  word: string
  user_id: string
  quality_score: number
  duration: number
  num_frames: number
  created_at: string
  metadata: any
}

interface TrainingStatus {
  phase: 'idle' | 'processing_videos' | 'training_text_to_pose' | 'training_pose_to_video' | 'completed' | 'failed'
  progress: number
  current_step: string
  metrics: {
    video_processing: {
      total_videos: number
      processed_videos: number
      failed_videos: number
      storage_saved_mb: number
    }
    text_to_pose: {
      epoch: number
      total_epochs: number
      loss: number
      best_loss: number | null
      samples_processed: number
    }
    pose_to_video: {
      epoch: number
      total_epochs: number
      loss: number
      best_loss: number | null
      samples_processed: number
    }
  }
  start_time: string | null
  elapsed_seconds: number
  estimated_remaining_seconds: number
  error_message: string | null
  sample_outputs: Array<{
    word: string
    video_path: string
    original_video_path?: string
    skeleton_video_path?: string
    pose_data?: any
    quality_score: number
    timestamp: string
    duration?: number
    fps?: number
  }>
  recent_logs: Array<{
    timestamp: string
    message: string
    level: string
  }>
}

interface GeneratedVideo {
  id: number
  source_type: string
  source_text: string | null
  source_skeleton_id: number | null
  model_type: string
  model_version: string | null
  video_filename: string
  video_path: string | null
  thumbnail_path: string | null
  duration: number | null
  fps: number
  num_frames: number | null
  resolution: string | null
  file_size_bytes: number | null
  generation_quality_score: number | null
  visual_quality_score: number | null
  status: string
  error_message: string | null
  created_at: string
}

interface GeneratedVideosStats {
  total_videos: number
  completed: number
  generating: number
  failed: number
  total_duration_seconds: number
  total_size_bytes: number
  total_size_mb: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email || ''

  const [activeTab, setActiveTab] = useState<'overview' | 'words' | 'contributions' | 'analytics' | 'quality' | 'studio' | 'skeletons' | 'generated-videos'>('overview')
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [words, setWords] = useState<WordStats[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null)
  const [previewContributionId, setPreviewContributionId] = useState<number | null>(null)
  const [trends, setTrends] = useState<{ daily_stats: DailyStats[], trend: string } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wordsPage, setWordsPage] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [selectedWord, setSelectedWord] = useState<WordStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const wordsPerPage = 10

  // AI Studio state
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null)
  const [selectedSample, setSelectedSample] = useState<any | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [sampleFilter, setSampleFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [sampleSort, setSampleSort] = useState<'recent' | 'quality' | 'word'>('recent')
  const [wordMetadata, setWordMetadata] = useState<Record<string, WordStats>>({})

  // Skeleton Preview state
  const [skeletons, setSkeletons] = useState<any[]>([])
  const [selectedSkeleton, setSelectedSkeleton] = useState<any | null>(null)
  const [skeletonStats, setSkeletonStats] = useState<any | null>(null)
  const [loadingSkeleton, setLoadingSkeleton] = useState(false)

  // Generated Videos state
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
  const [generatedVideosStats, setGeneratedVideosStats] = useState<GeneratedVideosStats | null>(null)
  const [selectedGeneratedVideo, setSelectedGeneratedVideo] = useState<GeneratedVideo | null>(null)

  // Memoized filtered and sorted words
  const sortedWords = useMemo(() => {
    const filtered = searchQuery.trim()
      ? words.filter(word => word.word.toLowerCase().includes(searchQuery.toLowerCase()))
      : words

    return [...filtered].sort((a, b) => {
      // Sort by: open first, then by total contributions (desc), then by word name
      if (a.is_open_for_contribution !== b.is_open_for_contribution) {
        return (b.is_open_for_contribution ? 1 : 0) - (a.is_open_for_contribution ? 1 : 0)
      }
      if (a.total_contributions !== b.total_contributions) {
        return b.total_contributions - a.total_contributions
      }
      return a.word.localeCompare(b.word)
    })
  }, [words, searchQuery])

  // Paginated words for current page
  const paginatedWords = useMemo(() => {
    return sortedWords.slice((wordsPage - 1) * wordsPerPage, wordsPage * wordsPerPage)
  }, [sortedWords, wordsPage, wordsPerPage])

  // Update totalWords based on filtered results
  useEffect(() => {
    setTotalWords(sortedWords.length)
    // Reset to page 1 when search changes
    if (searchQuery) {
      setWordsPage(1)
    }
  }, [sortedWords.length, searchQuery])

  // Fetch data
  const fetchOverview = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/overview`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch overview')
      const data = await res.json()
      setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchWords = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/words?limit=2000`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch words')
      const data = await res.json()
      setWords(data)
      setTotalWords(data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchTrends = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/analytics/trends?days=30`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch trends')
      const data = await res.json()
      setTrends(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchLeaderboard = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/analytics/leaderboard?metric=contributions&limit=50`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      const data = await res.json()
      setLeaderboard(data.leaderboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchQualityReport = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/quality-report`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch quality report')
      const data = await res.json()
      setQualityReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchContributions = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/contributions?limit=50`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch contributions')
      const data = await res.json()
      setContributions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const deleteContribution = async (contributionId: string) => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/ama/contributions/${contributionId}`, userEmail, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete contribution')
      // Refresh contributions list and overview
      await Promise.all([fetchContributions(), fetchOverview()])
      setSelectedContribution(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const toggleWordStatus = async (word: string, currentlyOpen: boolean) => {
    if (!userEmail) return
    try {
      const action = currentlyOpen ? 'close' : 'open'
      const res = await adminFetch(`${API_URL}/api/ama/words/${word}/${action}`, userEmail, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`Failed to ${action} word`)
      // Refresh words list
      await fetchWords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // AI Studio functions
  const fetchTrainingStatus = async () => {
    if (!userEmail) return
    try {
      const res = await adminFetch(`${API_URL}/api/admin/training/status`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch training status')
      const data = await res.json()
      setTrainingStatus(data)
    } catch (err) {
      console.error('Training status error:', err)
    }
  }

  const startTraining = async () => {
    if (!userEmail) return
    if (!confirm('Start full AI training pipeline? This will process ~10,000 videos and train models.')) {
      return
    }

    setIsStarting(true)
    try {
      const res = await adminFetch(`${API_URL}/api/admin/training/start`, userEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_to_pose_epochs: 100,
          pose_to_video_epochs: 50,
          batch_size: 4,
          learning_rate: 0.0001
        })
      })

      if (!res.ok) throw new Error('Failed to start training')
      const data = await res.json()
      alert(data.message || 'Training started successfully!')
      await fetchTrainingStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsStarting(false)
    }
  }

  const stopTraining = async () => {
    if (!userEmail) return
    if (!confirm('Stop training? Progress will be saved.')) {
      return
    }

    setIsStopping(true)
    try {
      const res = await adminFetch(`${API_URL}/api/admin/training/stop`, userEmail, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to stop training')
      const data = await res.json()
      alert(data.message || 'Training stopped successfully')
      await fetchTrainingStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      alert('Failed to stop training: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsStopping(false)
    }
  }

  // Download video function
  const downloadVideo = async (videoPath: string, filename: string) => {
    try {
      const res = await adminFetch(`${API_URL}${videoPath}`, userEmail)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download video')
    }
  }

  // Skeleton Preview functions - Use working skeleton-preview API
  const fetchSkeletonStats = async () => {
    try {
      const res = await adminFetch(`${API_URL}/api/skeleton-preview/stats`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch skeleton stats')
      const data = await res.json()
      setSkeletonStats(data)
    } catch (err) {
      console.error('Skeleton stats error:', err)
    }
  }

  const fetchSkeletons = async () => {
    try {
      const res = await adminFetch(`${API_URL}/api/skeleton-preview/available`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch skeletons')
      const data = await res.json()
      setSkeletons(data.skeletons || [])
    } catch (err) {
      console.error('Skeletons fetch error:', err)
      alert('Failed to load skeletons. Please check if the backend is running.')
    }
  }

  const loadSkeletonPose = async (skeletonId: string) => {
    setLoadingSkeleton(true)
    try {
      const res = await adminFetch(`${API_URL}/api/skeleton-preview/pose/${skeletonId}`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch skeleton pose')
      const data = await res.json()
      setSelectedSkeleton(data)
      setLoadingSkeleton(false)
    } catch (err) {
      console.error('Skeleton pose error:', err)
      alert('Failed to load skeleton')
      setLoadingSkeleton(false)
    }
  }

  // Generated Videos functions
  const fetchGeneratedVideos = async () => {
    try {
      const res = await adminFetch(`${API_URL}/api/generated-videos/?limit=50&status=completed`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch generated videos')
      const data = await res.json()
      setGeneratedVideos(data)
    } catch (err) {
      console.error('Generated videos fetch error:', err)
      alert('Failed to load generated videos. Please check if the backend is running.')
    }
  }

  const fetchGeneratedVideosStats = async () => {
    try {
      const res = await adminFetch(`${API_URL}/api/generated-videos/stats/summary`, userEmail)
      if (!res.ok) throw new Error('Failed to fetch generated videos stats')
      const data = await res.json()
      setGeneratedVideosStats(data)
    } catch (err) {
      console.error('Generated videos stats error:', err)
    }
  }

  // Filter and sort samples
  const filteredAndSortedSamples = useMemo(() => {
    if (!trainingStatus?.sample_outputs) return []

    let samples = [...trainingStatus.sample_outputs]

    // Filter by quality
    if (sampleFilter !== 'all') {
      samples = samples.filter(sample => {
        const quality = sample.quality_score
        if (sampleFilter === 'high') return quality >= 0.8
        if (sampleFilter === 'medium') return quality >= 0.5 && quality < 0.8
        if (sampleFilter === 'low') return quality < 0.5
        return true
      })
    }

    // Sort
    samples.sort((a, b) => {
      if (sampleSort === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      } else if (sampleSort === 'quality') {
        return b.quality_score - a.quality_score
      } else if (sampleSort === 'word') {
        return a.word.localeCompare(b.word)
      }
      return 0
    })

    return samples
  }, [trainingStatus?.sample_outputs, sampleFilter, sampleSort])

  // Fetch word metadata for samples
  useEffect(() => {
    if (!trainingStatus?.sample_outputs) return

    const uniqueWords = [...new Set(trainingStatus.sample_outputs.map(s => s.word))]
    uniqueWords.forEach(async (word) => {
      if (wordMetadata[word]) return

      const wordStats = words.find(w => w.word === word)
      if (wordStats) {
        setWordMetadata(prev => ({ ...prev, [word]: wordStats }))
      }
    })
  }, [trainingStatus?.sample_outputs, words, wordMetadata])

  const refreshAll = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      fetchOverview(),
      fetchWords(),
      fetchTrends(),
      fetchLeaderboard(),
      fetchQualityReport(),
      fetchContributions()
    ])
    setLoading(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  // AI Studio polling - poll every 2 seconds when on studio tab
  useEffect(() => {
    if (activeTab !== 'studio') return

    fetchTrainingStatus()
    const interval = setInterval(fetchTrainingStatus, 2000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Skeleton Preview - fetch when tab is active
  useEffect(() => {
    if (activeTab !== 'skeletons') return

    // Fetch skeletons immediately (fast)
    fetchSkeletons()

    // Fetch stats in background (can be slow, but non-blocking)
    fetchSkeletonStats()
  }, [activeTab])

  // Generated Videos - fetch when tab is active
  useEffect(() => {
    if (activeTab !== 'generated-videos') return

    // Fetch generated videos and stats
    fetchGeneratedVideos()
    fetchGeneratedVideosStats()
  }, [activeTab])

  // Health status badge
  const getHealthBadge = (health: string) => {
    const colors = {
      EXCELLENT: 'bg-green-500',
      GOOD: 'bg-blue-500',
      FAIR: 'bg-yellow-500',
      NEW: 'bg-gray-500'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${colors[health as keyof typeof colors] || 'bg-gray-500'}`}>
        {health}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-700">SignForge Platform Analytics & Management</p>
          </div>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'words', label: 'Words', icon: Database },
            { id: 'contributions', label: 'Contributions', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'quality', label: 'Quality', icon: Award },
            { id: 'studio', label: 'AI Studio', icon: Sparkles },
            { id: 'skeletons', label: 'Skeletons', icon: Zap },
            { id: 'generated-videos', label: 'Generated Videos', icon: Video }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 border-transparent hover:text-blue-600'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Contributions"
                value={overview.total_contributions.toLocaleString()}
                icon={<Activity className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Unique Contributors"
                value={overview.unique_contributors.toLocaleString()}
                icon={<Users className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Average Quality"
                value={`${(overview.average_quality_score * 100).toFixed(1)}%`}
                icon={<Award className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Ready for Training"
                value={overview.words_ready_for_training.toLocaleString()}
                icon={<TrendingUp className="w-6 h-6" />}
                color="orange"
              />
            </div>

            {/* System Info */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Status</p>
                  {getHealthBadge(overview.system_health)}
                </div>
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Total Data Points</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{(overview.total_data_points / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Total Frames</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{overview.total_frames_collected.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Storage Used</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{overview.storage_size_mb.toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Uptime</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{(overview.uptime_hours / 24).toFixed(1)} days</p>
                </div>
                <div>
                  <p className="text-gray-700 mb-2 text-sm sm:text-base">Last Contribution</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {overview.last_contribution_time
                      ? new Date(overview.last_contribution_time).toLocaleString()
                      : 'No contributions yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  Top Contributors
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{entry.user_id.substring(0, 20)}</p>
                          <p className="text-xs sm:text-sm text-gray-700">{entry.words.length} words</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-bold text-gray-900">{entry.total_contributions}</p>
                        <p className="text-xs sm:text-sm text-gray-700">{(entry.average_quality * 100).toFixed(0)}% quality</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Contributions</h2>
                  <p className="text-sm text-gray-600">{contributions.length} contributions</p>
                </div>
                {contributions.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm(`⚠️ DELETE ALL ${contributions.length} CONTRIBUTIONS?\n\nThis will permanently delete:\n• All contribution data\n• Associated votes, flags, and comments\n\nThis action CANNOT be undone!`)) return
                      if (!confirm('Are you ABSOLUTELY sure? Type "DELETE" mentally and click OK to proceed.')) return
                      try {
                        const res = await adminFetch(`${API_URL}/api/ama/contributions?confirm=true`, userEmail, { method: 'DELETE' })
                        if (!res.ok) throw new Error('Failed to delete contributions')
                        const data = await res.json()
                        alert(`✅ ${data.deleted_count} contributions deleted`)
                        fetchContributions()
                        fetchOverview()
                      } catch (err) {
                        alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'))
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                )}
              </div>

              {contributions.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  <p className="text-lg mb-2">No contributions yet</p>
                  <p className="text-sm">Contributions will appear here once users start submitting sign recordings.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Word</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quality</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Frames</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contributions.map(contrib => (
                          <tr key={contrib.contribution_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                              {contrib.word}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 text-sm">
                              {contrib.user_id.substring(0, 12)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${
                                contrib.quality_score >= 0.8 ? 'text-green-700' :
                                contrib.quality_score >= 0.6 ? 'text-blue-700' :
                                'text-yellow-700'
                              }`}>
                                {(contrib.quality_score * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {contrib.num_frames}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {contrib.duration.toFixed(2)}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                              {new Date(contrib.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => setPreviewContributionId(contrib.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Preview & Manage"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 p-4">
                    {contributions.map(contrib => (
                      <div
                        key={contrib.contribution_id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        {/* Header with Word and Quality */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg text-gray-900">{contrib.word}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            contrib.quality_score >= 0.8 ? 'bg-green-100 text-green-800' :
                            contrib.quality_score >= 0.6 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(contrib.quality_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Frames</p>
                            <p className="font-semibold text-gray-900">{contrib.num_frames}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-semibold text-gray-900">{contrib.duration.toFixed(1)}s</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold text-gray-900 text-xs">{new Date(contrib.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* User ID and Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500 truncate max-w-[60%]">
                            {contrib.user_id}
                          </span>
                          <button
                            onClick={() => setPreviewContributionId(contrib.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Words Tab */}
        {activeTab === 'words' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Word Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Control which words are open for data collection</p>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search words..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {words.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  <p className="text-lg mb-2">No words available</p>
                  <p className="text-sm">Open words from the database to start collecting contributions.</p>
                </div>
              ) : sortedWords.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg mb-2">No words found</p>
                  <p className="text-sm">No words match "{searchQuery}". Try a different search term.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Word</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contributions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quality</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Access</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedWords.map(word => (
                          <tr
                            key={word.word}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedWord(word)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{word.word}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {word.total_contributions}/50
                              <span className="text-gray-600 text-sm ml-2">
                                ({word.unique_contributors} users)
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${
                                word.average_quality >= 0.8 ? 'text-green-700' :
                                word.average_quality >= 0.6 ? 'text-blue-700' :
                                'text-yellow-700'
                              }`}>
                                {word.total_contributions > 0 ? `${(word.average_quality * 100).toFixed(0)}%` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {word.ready_for_training ? (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                                  ✅ Ready
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                                  Need {word.contributions_needed}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {word.is_open_for_contribution ? (
                                <div className="flex items-center gap-2 text-green-700">
                                  <Unlock className="w-4 h-4" />
                                  <span className="font-semibold text-sm">Open</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-red-700">
                                  <Lock className="w-4 h-4" />
                                  <span className="font-semibold text-sm">Closed</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleWordStatus(word.word, word.is_open_for_contribution ?? false)
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                  word.is_open_for_contribution
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {word.is_open_for_contribution ? (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Close
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-4 h-4" />
                                    Open
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4 p-4">
                    {paginatedWords.map(word => (
                      <div
                        key={word.word}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedWord(word)}
                      >
                        {/* Word Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                          {word.is_open_for_contribution ? (
                            <div className="flex items-center gap-1 text-green-700">
                              <Unlock className="w-4 h-4" />
                              <span className="font-semibold text-xs">Open</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-700">
                              <Lock className="w-4 h-4" />
                              <span className="font-semibold text-xs">Closed</span>
                            </div>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Contributions</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {word.total_contributions}/50
                            </p>
                            <p className="text-xs text-gray-500">{word.unique_contributors} users</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Quality</p>
                            <p className={`text-sm font-semibold ${
                              word.average_quality >= 0.8 ? 'text-green-700' :
                              word.average_quality >= 0.6 ? 'text-blue-700' :
                              'text-yellow-700'
                            }`}>
                              {word.total_contributions > 0 ? `${(word.average_quality * 100).toFixed(0)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-3">
                          {word.ready_for_training ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                              ✅ Ready for Training
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                              Need {word.contributions_needed} more
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleWordStatus(word.word, word.is_open_for_contribution ?? false)
                          }}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            word.is_open_for_contribution
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {word.is_open_for_contribution ? (
                            <>
                              <Lock className="w-4 h-4" />
                              Close for Contributions
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              Open for Contributions
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Page Info */}
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-semibold">{Math.min((wordsPage - 1) * wordsPerPage + 1, totalWords)}</span> to{' '}
                        <span className="font-semibold">{Math.min(wordsPage * wordsPerPage, totalWords)}</span> of{' '}
                        <span className="font-semibold">{totalWords}</span> words
                      </div>

                      {/* Pagination Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setWordsPage(Math.max(1, wordsPage - 1))}
                          disabled={wordsPage === 1}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            wordsPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          ← Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(totalWords / wordsPerPage) }, (_, i) => i + 1)
                            .filter(page => {
                              // Show first, last, current, and 1 page before/after current
                              return page === 1 ||
                                     page === Math.ceil(totalWords / wordsPerPage) ||
                                     Math.abs(page - wordsPage) <= 1
                            })
                            .map((page, idx, arr) => (
                              <React.Fragment key={page}>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                                <button
                                  onClick={() => setWordsPage(page)}
                                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    page === wordsPage
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                        </div>

                        <button
                          onClick={() => setWordsPage(Math.min(Math.ceil(totalWords / wordsPerPage), wordsPage + 1))}
                          disabled={wordsPage === Math.ceil(totalWords / wordsPerPage)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            wordsPage === Math.ceil(totalWords / wordsPerPage)
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && trends && (
          <div className="space-y-4 sm:space-y-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contribution Trends (30 Days)</h2>
                <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-sm sm:text-base ${
                  trends.trend === 'GROWING' ? 'bg-green-100 text-green-800' :
                  trends.trend === 'DECLINING' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trends.trend}
                </span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {trends.daily_stats.map(stat => (
                  <div key={stat.date} className="flex items-center gap-2 sm:gap-4">
                    <div className="w-20 sm:w-24 text-xs sm:text-sm text-gray-700">{new Date(stat.date).toLocaleDateString()}</div>
                    <div className="flex-1">
                      <div className="bg-blue-100 rounded-full h-6 sm:h-8 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 text-white text-xs sm:text-sm font-semibold"
                          style={{ width: `${Math.min(100, (stat.contributions / Math.max(...trends.daily_stats.map(s => s.contributions))) * 100)}%` }}
                        >
                          {stat.contributions > 0 && stat.contributions}
                        </div>
                      </div>
                    </div>
                    <div className="w-24 sm:w-32 text-right text-xs sm:text-sm text-gray-700">
                      {(stat.average_quality * 100).toFixed(0)}% quality
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && qualityReport && (
          <div className="space-y-4 sm:space-y-6">
            {/* Quality Distribution */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">Quality Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">{qualityReport.high_quality_count}</p>
                  <p className="text-sm sm:text-base text-gray-700">High Quality (≥80%)</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{qualityReport.medium_quality_count}</p>
                  <p className="text-sm sm:text-base text-gray-700">Medium (60-80%)</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{qualityReport.low_quality_count}</p>
                  <p className="text-sm sm:text-base text-gray-700">Low (&lt;60%)</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm sm:text-base text-gray-700 mb-2">Hand Detection Rate</p>
                  <div className="bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-green-600 h-full rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
                      style={{ width: `${qualityReport.hand_detection_rate * 100}%` }}
                    >
                      {(qualityReport.hand_detection_rate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-gray-700 mb-2">Data Completeness</p>
                  <div className="bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-600 h-full rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
                      style={{ width: `${qualityReport.data_completeness_score * 100}%` }}
                    >
                      {(qualityReport.data_completeness_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FPS Distribution */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">FPS Distribution</h2>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(qualityReport.fps_distribution).map(([range, count]) => (
                  <div key={range} className="flex items-center gap-2 sm:gap-4">
                    <div className="w-24 sm:w-32 text-xs sm:text-sm font-semibold text-gray-900">{range}</div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-full h-6 sm:h-8 relative overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 text-white text-xs sm:text-sm font-semibold"
                          style={{ width: `${(count / qualityReport.total_contributions) * 100}%` }}
                        >
                          {count > 0 && count}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contribution Preview Modal */}
        {selectedContribution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedContribution(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Contribution Details
                </h2>
                <button
                  onClick={() => setSelectedContribution(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Word and ID */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedContribution.word}</h3>
                  <p className="text-sm text-gray-700">
                    Contribution ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedContribution.contribution_id}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedContribution.user_id}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Timestamp: {new Date(selectedContribution.created_at).toLocaleString()} UTC
                  </p>
                </div>

                {/* Recording Stats */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Recording Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700">Frames</p>
                      <p className="text-xl font-bold text-gray-900">{selectedContribution.num_frames} frames</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Duration</p>
                      <p className="text-xl font-bold text-gray-900">{selectedContribution.duration.toFixed(3)} seconds</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Calculated FPS</p>
                      <p className="text-xl font-bold text-gray-900">
                        {(selectedContribution.num_frames / selectedContribution.duration).toFixed(2)} FPS
                        {Math.abs((selectedContribution.num_frames / selectedContribution.duration) - 30.5) <= 3 ?
                          <span className="text-green-600 text-sm ml-2">✅</span> :
                          <span className="text-yellow-600 text-sm ml-2">⚠️</span>
                        }
                      </p>
                      <p className="text-xs text-gray-600">Expected: ~30.5 FPS</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Quality Score</p>
                      <p className={`text-xl font-bold ${
                        selectedContribution.quality_score >= 0.8 ? 'text-green-700' :
                        selectedContribution.quality_score >= 0.6 ? 'text-blue-700' :
                        'text-yellow-700'
                      }`}>
                        {(selectedContribution.quality_score * 100).toFixed(1)}%
                        {selectedContribution.quality_score >= 0.8 ? ' - Excellent!' :
                         selectedContribution.quality_score >= 0.6 ? ' - Good' : ' - Needs improvement'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Classification (if available) */}
                {selectedContribution.metadata?.movement_type && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Classification</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-700">Movement Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{selectedContribution.metadata.movement_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">Hand Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{selectedContribution.metadata.hand_type}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3-Attempt Average (if available) */}
                {selectedContribution.metadata?.attempt_data && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">3-Attempt Average</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Number of Attempts: <span className="font-bold">{selectedContribution.metadata.attempt_data.num_attempts || 3}</span>
                    </p>
                    {selectedContribution.metadata.attempt_data.individual_scores && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 mb-2">Individual Quality Scores:</p>
                        <ul className="space-y-1">
                          {selectedContribution.metadata.attempt_data.individual_scores.map((score: number, idx: number) => (
                            <li key={idx} className="text-sm">
                              <span className="text-gray-700">Attempt {idx + 1}:</span>
                              <span className="font-semibold text-gray-900 ml-2">
                                {(score * 100).toFixed(1)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-700">Average Quality</p>
                      <p className="text-xl font-bold text-green-700">
                        {(selectedContribution.quality_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Data Quality Metrics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Data Quality Standards</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">FPS (27-34)</span>
                      <span className={`font-semibold ${
                        (selectedContribution.num_frames / selectedContribution.duration) >= 27 &&
                        (selectedContribution.num_frames / selectedContribution.duration) <= 34 ?
                        'text-green-700' : 'text-yellow-700'
                      }`}>
                        {(selectedContribution.num_frames / selectedContribution.duration) >= 27 &&
                         (selectedContribution.num_frames / selectedContribution.duration) <= 34 ? '✅' : '⚠️'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Quality Score (≥60%)</span>
                      <span className={`font-semibold ${
                        selectedContribution.quality_score >= 0.6 ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {selectedContribution.quality_score >= 0.6 ? '✅' : '⚠️'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Duration (1-5s)</span>
                      <span className={`font-semibold ${
                        selectedContribution.duration >= 1.0 && selectedContribution.duration <= 5.0 ?
                        'text-green-700' : 'text-yellow-700'
                      }`}>
                        {selectedContribution.duration >= 1.0 && selectedContribution.duration <= 5.0 ? '✅' : '⚠️'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Frame Count (30-150)</span>
                      <span className={`font-semibold ${
                        selectedContribution.num_frames >= 30 && selectedContribution.num_frames <= 150 ?
                        'text-green-700' : 'text-yellow-700'
                      }`}>
                        {selectedContribution.num_frames >= 30 && selectedContribution.num_frames <= 150 ? '✅' : '⚠️'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete this contribution for "${selectedContribution.word}"?`)) {
                        await deleteContribution(selectedContribution.contribution_id)
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Contribution
                  </button>
                  <button
                    onClick={() => setSelectedContribution(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Studio Tab */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Training Status Card */}
            {trainingStatus && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                    AI Training Studio
                  </h2>
                  <div className="flex gap-3">
                    {trainingStatus.phase === 'idle' ? (
                      <button
                        onClick={startTraining}
                        disabled={isStarting}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50"
                      >
                        <Play className="w-5 h-5" />
                        {isStarting ? 'Starting...' : 'Start Training'}
                      </button>
                    ) : (
                      <button
                        onClick={stopTraining}
                        disabled={isStopping}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pause className="w-5 h-5" />
                        {isStopping ? 'Stopping...' : 'Stop Training'}
                      </button>
                    )}
                    <button
                      onClick={fetchTrainingStatus}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Phase Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { phase: 'processing_videos', label: 'Video Processing', icon: '🎬', color: 'blue' },
                    { phase: 'training_text_to_pose', label: 'Text → Pose', icon: '📝', color: 'purple' },
                    { phase: 'training_pose_to_video', label: 'Pose → Video', icon: '🎥', color: 'green' },
                    { phase: 'completed', label: 'Completed', icon: '✅', color: 'emerald' }
                  ].map(({ phase, label, icon, color }) => {
                    const isActive = trainingStatus.phase === phase
                    const isPast = ['processing_videos', 'training_text_to_pose', 'training_pose_to_video', 'completed'].indexOf(trainingStatus.phase) >
                      ['processing_videos', 'training_text_to_pose', 'training_pose_to_video', 'completed'].indexOf(phase)

                    return (
                      <div key={phase} className={`p-4 rounded-lg border-2 transition ${
                        isActive ? `bg-${color}-50 border-${color}-500` :
                        isPast ? `bg-${color}-50 border-${color}-300` :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className={`font-semibold ${isActive ? `text-${color}-700` : 'text-gray-700'}`}>
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Progress Bar */}
                {trainingStatus.phase !== 'idle' && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{trainingStatus.current_step}</span>
                      <span className="text-sm font-bold text-purple-600">{trainingStatus.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                        style={{ width: `${trainingStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Video Processing Metrics */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Video Processing
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed:</span>
                        <span className="font-bold text-blue-700">
                          {trainingStatus.metrics.video_processing.processed_videos}/{trainingStatus.metrics.video_processing.total_videos}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-bold text-red-600">{trainingStatus.metrics.video_processing.failed_videos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Saved:</span>
                        <span className="font-bold text-green-600">{trainingStatus.metrics.video_processing.storage_saved_mb.toFixed(0)} MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Text-to-Pose Metrics */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Text-to-Pose Model
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Epoch:</span>
                        <span className="font-bold text-purple-700">
                          {trainingStatus.metrics.text_to_pose.epoch}/{trainingStatus.metrics.text_to_pose.total_epochs}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Loss:</span>
                        <span className="font-bold text-orange-600">
                          {trainingStatus.metrics.text_to_pose.loss > 0 ? trainingStatus.metrics.text_to_pose.loss.toFixed(6) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Loss:</span>
                        <span className="font-bold text-green-600">
                          {trainingStatus.metrics.text_to_pose.best_loss === null || trainingStatus.metrics.text_to_pose.best_loss === Infinity
                            ? 'N/A'
                            : trainingStatus.metrics.text_to_pose.best_loss.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pose-to-Video Metrics */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Pose-to-Video Model
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Epoch:</span>
                        <span className="font-bold text-green-700">
                          {trainingStatus.metrics.pose_to_video.epoch}/{trainingStatus.metrics.pose_to_video.total_epochs}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Loss:</span>
                        <span className="font-bold text-orange-600">
                          {trainingStatus.metrics.pose_to_video.loss > 0 ? trainingStatus.metrics.pose_to_video.loss.toFixed(6) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Loss:</span>
                        <span className="font-bold text-green-600">
                          {trainingStatus.metrics.pose_to_video.best_loss === null || trainingStatus.metrics.pose_to_video.best_loss === Infinity
                            ? 'N/A'
                            : trainingStatus.metrics.pose_to_video.best_loss.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Estimates */}
                {trainingStatus.start_time && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Elapsed Time</p>
                      <p className="text-xl font-bold text-gray-900">
                        {Math.floor(trainingStatus.elapsed_seconds / 3600)}h {Math.floor((trainingStatus.elapsed_seconds % 3600) / 60)}m {Math.floor(trainingStatus.elapsed_seconds % 60)}s
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Remaining Time</p>
                      <p className="text-xl font-bold text-gray-900">
                        {trainingStatus.estimated_remaining_seconds > 0
                          ? `${Math.floor(trainingStatus.estimated_remaining_seconds / 3600)}h ${Math.floor((trainingStatus.estimated_remaining_seconds % 3600) / 60)}m`
                          : 'Calculating...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {trainingStatus.error_message && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-800 mb-1">Training Failed</p>
                    <p className="text-red-700 text-sm">{trainingStatus.error_message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sample Outputs Preview */}
            {trainingStatus && trainingStatus.sample_outputs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Generated Samples
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainingStatus.sample_outputs.map((sample, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSample(sample)}
                      className="group cursor-pointer bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg text-gray-900">{sample.word}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          sample.quality_score >= 0.8 ? 'bg-green-100 text-green-700' :
                          sample.quality_score >= 0.5 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {(sample.quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      {sample.video_path ? (
                        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                          <VideoPlayer
                            src={`${API_URL}${sample.video_path}`}
                            className="aspect-video"
                            muted={true}
                            loop={true}
                            controls={false}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <Video className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        {new Date(sample.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Logs */}
            {trainingStatus && trainingStatus.recent_logs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Logs</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trainingStatus.recent_logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-sm ${
                        log.level === 'error' ? 'bg-red-50 text-red-800' :
                        log.level === 'success' ? 'bg-green-50 text-green-800' :
                        'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="font-mono text-xs text-gray-500 mr-3">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!trainingStatus && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Training Studio</h3>
                <p className="text-gray-600 mb-6">Start training to see real-time progress and generated samples</p>
                <button
                  onClick={startTraining}
                  disabled={isStarting}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50"
                >
                  {isStarting ? 'Connecting...' : 'Start AI Training'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sample Detail Modal */}
        {selectedSample && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSample(null)}
          >
            <div
              className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">{selectedSample.word}</h2>
                  <button
                    onClick={() => setSelectedSample(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Original Video */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Original Video
                    </h3>
                    {selectedSample.original_video_path ? (
                      <VideoPlayer
                        src={`${API_URL}${selectedSample.original_video_path}`}
                        className="aspect-video"
                        onDownload={() => downloadVideo(selectedSample.original_video_path, `${selectedSample.word}_original.mp4`)}
                      />
                    ) : (
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <Video className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Extracted Pose Skeleton */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Pose Skeleton
                    </h3>
                    {selectedSample.pose_data && selectedSample.pose_data.length > 0 ? (
                      <SkeletonVisualizer
                        poseData={selectedSample.pose_data}
                        className="aspect-video"
                        playing={true}
                        fps={25}
                        word={selectedSample.word}
                      />
                    ) : selectedSample.skeleton_video_path ? (
                      <VideoPlayer
                        src={`${API_URL}${selectedSample.skeleton_video_path}`}
                        className="aspect-video"
                        onDownload={() => downloadVideo(selectedSample.skeleton_video_path, `${selectedSample.word}_skeleton.mp4`)}
                      />
                    ) : (
                      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-white text-sm">Skeleton data not available</div>
                      </div>
                    )}
                  </div>

                  {/* AI Generated Video */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Generated
                    </h3>
                    {selectedSample.video_path ? (
                      <VideoPlayer
                        src={`${API_URL}${selectedSample.video_path}`}
                        className="aspect-video"
                        onDownload={() => downloadVideo(selectedSample.video_path, `${selectedSample.word}_generated.mp4`)}
                      />
                    ) : (
                      <div className="aspect-video bg-purple-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-purple-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Quality Score</p>
                      <p className="text-2xl font-bold text-green-700">{(selectedSample.quality_score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Generated At</p>
                      <p className="text-lg font-semibold text-gray-900">{new Date(selectedSample.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skeletons Tab */}
        {activeTab === 'skeletons' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Skeleton Stats Cards */}
            {skeletonStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Total Skeletons</p>
                  <p className="text-4xl font-bold">{skeletonStats.total_skeletons}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Total Frames</p>
                  <p className="text-4xl font-bold">{skeletonStats.total_frames.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Avg Frames/Skeleton</p>
                  <p className="text-4xl font-bold">{Math.round(skeletonStats.avg_frames_per_skeleton)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Unique Words</p>
                  <p className="text-4xl font-bold">{skeletonStats.unique_words}</p>
                </div>
              </div>
            )}

            {/* Skeleton Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6" />
                Pose Skeletons
              </h2>

              {skeletons.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No skeletons available yet</p>
                  <p className="text-sm mt-2">Start training to process videos and extract pose data</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {skeletons.map((skeleton) => (
                    <div
                      key={skeleton.id}
                      onClick={() => loadSkeletonPose(skeleton.id)}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:bg-gray-100 transition group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{skeleton.word}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {skeleton.frames} frames
                        </span>
                      </div>
                      <div className="aspect-video bg-gray-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                        <Activity className="w-12 h-12 text-gray-600" />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition flex items-center justify-center">
                          <Play className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>FPS: {skeleton.fps}</p>
                        <p className="text-xs truncate">{skeleton.video_filename}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skeleton Detail Modal */}
        {selectedSkeleton && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSkeleton(null)}
          >
            <div
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Skeleton: {selectedSkeleton.word}</h2>
                  <button
                    onClick={() => setSelectedSkeleton(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skeleton Visualization */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900">Pose Animation</h3>
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                      <SkeletonVisualizer
                        poseData={selectedSkeleton.pose_sequence}
                        playing={true}
                        fps={selectedSkeleton.fps}
                        className="w-full aspect-video"
                        word={selectedSkeleton.word}
                      />
                    </div>
                  </div>

                  {/* Skeleton Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Skeleton Data</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Word</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedSkeleton.word}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Frames</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedSkeleton.extracted_frames}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">FPS</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedSkeleton.fps}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Landmarks per Frame</p>
                        <p className="text-lg font-semibold text-gray-900">33 (MediaPipe Pose)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Video Source</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{selectedSkeleton.video_filename}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Videos Tab */}
        {activeTab === 'generated-videos' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            {generatedVideosStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Total Videos</p>
                  <p className="text-4xl font-bold">{generatedVideosStats.total_videos}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Completed</p>
                  <p className="text-4xl font-bold">{generatedVideosStats.completed}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Total Duration</p>
                  <p className="text-4xl font-bold">{generatedVideosStats.total_duration_seconds.toFixed(1)}s</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                  <p className="text-white/90 mb-2">Total Size</p>
                  <p className="text-4xl font-bold">{generatedVideosStats.total_size_mb.toFixed(1)} MB</p>
                </div>
              </div>
            )}

            {/* Videos Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Video className="w-6 h-6" />
                AI-Generated Videos
              </h2>

              {generatedVideos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No generated videos yet</p>
                  <p className="text-sm mt-2">Videos will appear here once generated from pose skeletons</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedGeneratedVideo(video)}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:bg-gray-100 transition group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {video.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {(video.file_size_bytes ? video.file_size_bytes / 1024 / 1024 : 0).toFixed(2)} MB
                        </span>
                      </div>

                      <div className="aspect-video bg-gray-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                        {video.video_path ? (
                          <video
                            src={`${API_URL}/${video.video_path}`}
                            className="w-full h-full object-contain"
                            muted
                            loop
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                        ) : (
                          <Video className="w-12 h-12 text-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                          <Play className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition" />
                        </div>
                      </div>

                      <div className="text-sm text-gray-900 space-y-2">
                        <p className="font-semibold truncate">{video.source_text || 'Generated Video'}</p>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{video.num_frames} frames</span>
                          <span>{video.duration?.toFixed(2)}s</span>
                        </div>
                        {video.generation_quality_score && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${video.generation_quality_score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {(video.generation_quality_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Video Detail Modal */}
        {selectedGeneratedVideo && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedGeneratedVideo(null)}
          >
            <div
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Generated Video #{selectedGeneratedVideo.id}</h2>
                  <button
                    onClick={() => setSelectedGeneratedVideo(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Video Player */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900">Generated Video</h3>
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                      {selectedGeneratedVideo.video_path ? (
                        <VideoPlayer
                          src={`${API_URL}/${selectedGeneratedVideo.video_path}`}
                          className="w-full aspect-video"
                          onDownload={() => downloadVideo(`/${selectedGeneratedVideo.video_path}`, selectedGeneratedVideo.video_filename)}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-900 flex items-center justify-center">
                          <p className="text-white text-sm">Video not available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h3 className="font-semibold text-gray-900">Video Metadata</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Source Text</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.source_text || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Source Skeleton ID</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.source_skeleton_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Model</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.model_type}</p>
                        <p className="text-xs text-gray-600">{selectedGeneratedVideo.model_version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.duration?.toFixed(2)}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Resolution</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.resolution}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Frames</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedGeneratedVideo.num_frames} @ {selectedGeneratedVideo.fps.toFixed(2)} FPS</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">File Size</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {(selectedGeneratedVideo.file_size_bytes ? selectedGeneratedVideo.file_size_bytes / 1024 / 1024 : 0).toFixed(2)} MB
                        </p>
                      </div>
                      {selectedGeneratedVideo.generation_quality_score && (
                        <div>
                          <p className="text-sm text-gray-600">Quality Score</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {(selectedGeneratedVideo.generation_quality_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          selectedGeneratedVideo.status === 'completed' ? 'bg-green-100 text-green-700' :
                          selectedGeneratedVideo.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedGeneratedVideo.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-sm text-gray-900">{new Date(selectedGeneratedVideo.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Word Detail Modal */}
        {selectedWord && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWord(null)}
          >
            <div
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedWord.word}</h2>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  {selectedWord.is_open_for_contribution ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold">
                      <Unlock className="w-4 h-4" />
                      Open for Contributions
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 font-semibold">
                      <Lock className="w-4 h-4" />
                      Closed for Contributions
                    </span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedWord.total_contributions}/50</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Contributors</p>
                    <p className="text-2xl font-bold text-purple-700">{selectedWord.unique_contributors}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Quality</p>
                    <p className="text-2xl font-bold text-green-700">
                      {selectedWord.total_contributions > 0 ? `${(selectedWord.average_quality * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg FPS</p>
                    <p className="text-2xl font-bold text-orange-700">{selectedWord.average_fps.toFixed(1)}</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                    <p className="text-2xl font-bold text-pink-700">{selectedWord.average_duration.toFixed(1)}s</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Frames</p>
                    <p className="text-2xl font-bold text-indigo-700">{selectedWord.total_frames}</p>
                  </div>
                </div>

                {/* Quality Range */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Quality Range</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Min</p>
                      <p className="text-lg font-bold text-red-700">{(selectedWord.min_quality * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Max</p>
                      <p className="text-lg font-bold text-green-700">{(selectedWord.max_quality * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                {/* Training Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Training Status</h3>
                  {selectedWord.ready_for_training ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">✅ Ready for Training</p>
                      <p className="text-green-700 text-sm mt-1">This word has enough high-quality contributions</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-semibold">⏳ In Progress</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Need {selectedWord.contributions_needed} more contributions
                      </p>
                    </div>
                  )}
                </div>

                {/* Last Contribution */}
                {selectedWord.last_contribution && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Last Contribution</h3>
                    <p className="text-gray-600">{new Date(selectedWord.last_contribution).toLocaleString()}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 pt-6 border-t flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWordStatus(selectedWord.word, selectedWord.is_open_for_contribution ?? false)
                      setSelectedWord(null)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      selectedWord.is_open_for_contribution
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedWord.is_open_for_contribution ? 'Close' : 'Open'} for Contributions
                  </button>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contribution Preview Modal */}
      {previewContributionId && (
        <ContributionPreviewModal
          contributionId={previewContributionId}
          onClose={() => setPreviewContributionId(null)}
          onDeleted={() => {
            setPreviewContributionId(null);
            fetchContributions(); // Refresh list
          }}
          onUpdated={() => {
            fetchContributions(); // Refresh list
          }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-xl shadow-md p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/90">{title}</p>
        {icon}
      </div>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  )
}
