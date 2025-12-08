'use client'

import { useEffect, useState } from 'react'

interface TrainingStatus {
  phase: string
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
      best_loss: number
      samples_processed: number
    }
    pose_to_video: {
      epoch: number
      total_epochs: number
      loss: number
      best_loss: number
      samples_processed: number
    }
  }
  start_time: string | null
  elapsed_seconds?: number
  estimated_remaining_seconds?: number
  error_message: string | null
  sample_outputs: Array<{
    word: string
    video_path: string
    quality_score: number
    timestamp: string
  }>
  recent_logs: Array<{
    timestamp: string
    message: string
    level: string
  }>
}

export default function AITrainingMonitor() {
  const [status, setStatus] = useState<TrainingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000'

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/training/status`)
      if (!response.ok) throw new Error('Failed to fetch status')

      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const startTraining = async () => {
    if (!confirm('Start full AI training pipeline? This will process 9,877 videos and train 2 neural networks. This may take several days.')) {
      return
    }

    setStarting(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/training/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_to_pose_epochs: 100,
          pose_to_video_epochs: 50,
          batch_size: 32,
          learning_rate: 0.001
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to start training')
      }

      alert('✓ Training started! Watch live progress below.')
      await fetchStatus()
    } catch (err) {
      alert(`Failed to start training: ${err}`)
    } finally {
      setStarting(false)
    }
  }

  const stopTraining = async () => {
    if (!confirm('Stop training? This cannot be undone.')) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/training/stop`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to stop training')
      alert('✓ Training stopped')
      await fetchStatus()
    } catch (err) {
      alert(`Failed to stop training: ${err}`)
    }
  }

  // Poll status every 2 seconds during training
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}h ${minutes}m ${secs}s`
  }

  const PhaseIndicator = ({ currentPhase }: { currentPhase: string }) => {
    const phases = [
      { id: 'idle', label: 'Idle', icon: '⏸️' },
      { id: 'processing_videos', label: 'Processing Videos', icon: '🎬' },
      { id: 'training_text_to_pose', label: 'Training Text→Pose', icon: '🧠' },
      { id: 'training_pose_to_video', label: 'Training Pose→Video', icon: '🎨' },
      { id: 'completed', label: 'Complete', icon: '✅' },
      { id: 'failed', label: 'Failed', icon: '❌' }
    ]

    return (
      <div className="flex items-center justify-between mb-8">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-center">
            <div
              className={`flex flex-col items-center ${
                currentPhase === phase.id
                  ? 'text-blue-600 font-bold'
                  : phases.findIndex(p => p.id === currentPhase) > idx
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div className="text-3xl mb-2">{phase.icon}</div>
              <div className="text-sm text-center">{phase.label}</div>
            </div>
            {idx < phases.length - 1 && (
              <div
                className={`h-1 w-12 mx-4 ${
                  phases.findIndex(p => p.id === currentPhase) > idx
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading AI training monitor...</div>
      </div>
    )
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="bg-red-600 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-red-600 px-4 py-2 rounded hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const isTraining = status?.phase && !['idle', 'completed', 'failed'].includes(status.phase)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🤖 AI Training Monitor</h1>
            <p className="text-purple-200">
              Real-time monitoring of neural network training
            </p>
          </div>
          <div className="flex gap-4">
            {!isTraining && status?.phase === 'idle' && (
              <button
                onClick={startTraining}
                disabled={starting}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? '🔄 Starting...' : '🚀 Start Training'}
              </button>
            )}
            {isTraining && (
              <button
                onClick={stopTraining}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
              >
                ⏹️ Stop Training
              </button>
            )}
          </div>
        </div>

        {/* Phase Progress */}
        {status && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <PhaseIndicator currentPhase={status.phase} />
          </div>
        )}

        {/* Current Status Card */}
        {status && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{status.current_step}</h2>
                <p className="text-sm text-gray-500 mt-1">Phase: {status.phase.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{status.progress.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-bold"
                style={{ width: `${Math.min(status.progress, 100)}%` }}
              >
                {status.progress > 5 && `${status.progress.toFixed(1)}%`}
              </div>
            </div>

            {/* Time Information */}
            {status.start_time && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Elapsed</p>
                  <p className="font-bold text-lg">{formatTime(status.elapsed_seconds)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-bold text-lg">{formatTime(status.estimated_remaining_seconds)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="font-bold text-lg">
                    {new Date(status.start_time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Video Processing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎬 Video Processing</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-bold">{status.metrics.video_processing.processed_videos}/{status.metrics.video_processing.total_videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-bold text-red-600">{status.metrics.video_processing.failed_videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Saved:</span>
                  <span className="font-bold text-green-600">{status.metrics.video_processing.storage_saved_mb.toFixed(0)} MB</span>
                </div>
              </div>
            </div>

            {/* Text-to-Pose */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🧠 Text→Pose Model</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Epoch:</span>
                  <span className="font-bold">{status.metrics.text_to_pose.epoch}/{status.metrics.text_to_pose.total_epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loss:</span>
                  <span className="font-bold">{status.metrics.text_to_pose.loss.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Loss:</span>
                  <span className="font-bold text-green-600">{status.metrics.text_to_pose.best_loss === Infinity || status.metrics.text_to_pose.best_loss === null ? 'N/A' : status.metrics.text_to_pose.best_loss.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Pose-to-Video */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎨 Pose→Video Model</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Epoch:</span>
                  <span className="font-bold">{status.metrics.pose_to_video.epoch}/{status.metrics.pose_to_video.total_epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loss:</span>
                  <span className="font-bold">{status.metrics.pose_to_video.loss.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Loss:</span>
                  <span className="font-bold text-green-600">{status.metrics.pose_to_video.best_loss === Infinity || status.metrics.pose_to_video.best_loss === null ? 'N/A' : status.metrics.pose_to_video.best_loss.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status?.error_message && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">Training Failed</p>
            <p className="text-sm mt-1">{status.error_message}</p>
          </div>
        )}

        {/* Recent Logs */}
        {status && status.recent_logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6 text-white font-mono text-sm">
            <h3 className="text-lg font-bold mb-4">📝 Recent Logs</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {status.recent_logs.map((log, idx) => (
                <div key={idx} className={`${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}>
                  [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
