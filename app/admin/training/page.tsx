'use client'

import { useEffect, useState } from 'react'

type TrainingStatus = 'collecting' | 'ready_to_train' | 'training' | 'complete' | 'failed'

interface WordTrainingInfo {
  word: string
  status: TrainingStatus
  contribution_count: number
  required_contributions: number
  progress_percent: number
  is_ready: boolean
  training_started_at?: string
  training_completed_at?: string
  trained_model_path?: string
  quality_score?: number
  error_message?: string
}

interface TrainingQueue {
  collecting: WordTrainingInfo[]
  ready_to_train: WordTrainingInfo[]
  training: WordTrainingInfo[]
  complete: WordTrainingInfo[]
  failed: WordTrainingInfo[]
}

interface TrainingStatistics {
  total_words: number
  total_contributions: number
  collecting: number
  ready_to_train: number
  training: number
  complete: number
  failed: number
  completion_rate: number
}

export default function TrainingDashboard() {
  const [queue, setQueue] = useState<TrainingQueue | null>(null)
  const [statistics, setStatistics] = useState<TrainingStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingWord, setExportingWord] = useState<string | null>(null)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000'

  // Fetch training queue
  const fetchTrainingData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/training/queue`),
        fetch(`${BACKEND_URL}/api/training/statistics`),
      ])

      if (!queueRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch training data')
      }

      const queueData = await queueRes.json()
      const statsData = await statsRes.json()

      setQueue(queueData)
      setStatistics(statsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Export training data for offline training
  const handleExport = async (word: string) => {
    setExportingWord(word)
    try {
      const response = await fetch(`${BACKEND_URL}/api/training/export/${word}`)
      if (!response.ok) throw new Error('Export failed')

      // Download the tarball
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${word}_training_data.tar.gz`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`✓ Exported ${word} training data!\n\nNext steps:\n1. Extract the tar.gz file\n2. Run: python motion_alignment.py --word ${word}\n3. Upload trained model when complete`)
    } catch (err) {
      alert(`Export failed: ${err}`)
    } finally {
      setExportingWord(null)
    }
  }

  // Mark training as started (manual)
  const handleMarkTraining = async (word: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/training/mark-training/${word}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to mark training')
      await fetchTrainingData() // Refresh
      alert(`✓ Marked ${word} as training`)
    } catch (err) {
      alert(`Failed: ${err}`)
    }
  }

  // Poll for updates every 5 seconds
  useEffect(() => {
    fetchTrainingData()
    const interval = setInterval(fetchTrainingData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading training dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="bg-red-600 text-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const StatusBadge = ({ status }: { status: TrainingStatus }) => {
    const config = {
      collecting: { color: 'bg-red-500', text: '🔴 Collecting', desc: 'Need more contributions' },
      ready_to_train: { color: 'bg-yellow-500', text: '🟡 Ready', desc: 'Ready to train' },
      training: { color: 'bg-blue-500', text: '🔵 Training', desc: 'Currently training' },
      complete: { color: 'bg-green-500', text: '🟢 Complete', desc: 'Training complete' },
      failed: { color: 'bg-red-700', text: '❌ Failed', desc: 'Training failed' },
    }

    const { color, text } = config[status]
    return (
      <span className={`${color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
        {text}
      </span>
    )
  }

  const WordCard = ({ info }: { info: WordTrainingInfo }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{info.word}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {info.contribution_count}/{info.required_contributions} contributions
            </p>
          </div>
          <StatusBadge status={info.status} />
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                info.progress_percent >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(info.progress_percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{info.progress_percent}% complete</p>
        </div>

        {/* Quality Score */}
        {info.quality_score && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Quality: <span className="font-bold">{(info.quality_score * 100).toFixed(1)}%</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {info.status === 'ready_to_train' && (
            <>
              <button
                onClick={() => handleExport(info.word)}
                disabled={exportingWord === info.word}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {exportingWord === info.word ? 'Exporting...' : '📥 Export Data'}
              </button>
              <button
                onClick={() => handleMarkTraining(info.word)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                🚀 Mark Training
              </button>
            </>
          )}
          {info.status === 'collecting' && (
            <a
              href="/contribute"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              ➕ Add Contributions
            </a>
          )}
          {info.status === 'complete' && info.trained_model_path && (
            <button className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded cursor-default">
              ✓ Model Ready
            </button>
          )}
        </div>

        {/* Timestamps */}
        {info.training_completed_at && (
          <p className="text-xs text-gray-400 mt-2">
            Completed: {new Date(info.training_completed_at).toLocaleString()}
          </p>
        )}

        {/* Error Message */}
        {info.error_message && (
          <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {info.error_message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎓 Training Dashboard</h1>
          <p className="text-purple-200">
            Monitor contribution collection and manage offline training
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Total Words</p>
              <p className="text-3xl font-bold text-purple-600">{statistics.total_words}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Total Contributions</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.total_contributions}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Ready to Train</p>
              <p className="text-3xl font-bold text-yellow-600">{statistics.ready_to_train}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {(statistics.completion_rate * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Training Instructions */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-8 rounded">
          <h3 className="font-bold text-lg mb-2">📋 Training Workflow</h3>
          <ol className="list-decimal ml-5 space-y-1 text-sm">
            <li>Wait for 10+ contributions (status becomes 🟡 Ready)</li>
            <li>Click "📥 Export Data" to download contribution JSON files</li>
            <li>Run training on your laptop: <code className="bg-yellow-200 px-2 py-1 rounded">python motion_alignment.py --word HELLO</code></li>
            <li>Upload trained model back to server (manual for now)</li>
            <li>Dashboard shows "🟢 Complete" when model is ready</li>
          </ol>
        </div>

        {/* Ready to Train (Priority) */}
        {queue && queue.ready_to_train.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🟡 Ready to Train ({queue.ready_to_train.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.ready_to_train.map((info) => (
                <WordCard key={info.word} info={info} />
              ))}
            </div>
          </div>
        )}

        {/* Currently Training */}
        {queue && queue.training.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔵 Training ({queue.training.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.training.map((info) => (
                <WordCard key={info.word} info={info} />
              ))}
            </div>
          </div>
        )}

        {/* Collecting (Need More Contributions) */}
        {queue && queue.collecting.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔴 Collecting ({queue.collecting.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.collecting.map((info) => (
                <WordCard key={info.word} info={info} />
              ))}
            </div>
          </div>
        )}

        {/* Complete */}
        {queue && queue.complete.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🟢 Complete ({queue.complete.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.complete.map((info) => (
                <WordCard key={info.word} info={info} />
              ))}
            </div>
          </div>
        )}

        {/* Failed */}
        {queue && queue.failed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">❌ Failed ({queue.failed.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.failed.map((info) => (
                <WordCard key={info.word} info={info} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
