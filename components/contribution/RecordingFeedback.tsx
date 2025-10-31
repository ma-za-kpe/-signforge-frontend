'use client'

interface RecordingFeedbackProps {
  recordingElapsed: number
  recordingProgress: number
  showCompletionFlash: boolean
  onStopRecording: () => void
}

export default function RecordingFeedback({
  recordingElapsed,
  recordingProgress,
  showCompletionFlash,
  onStopRecording
}: RecordingFeedbackProps) {
  const remaining = Math.max(0, 3.0 - recordingElapsed)
  const isFinishingUp = remaining <= 0.5

  return (
    <>
      {/* Recording indicator with countdown */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-sm sm:text-base text-red-600 font-semibold">RECORDING...</span>
          <span className="text-sm sm:text-base text-red-600 font-semibold">
            {remaining.toFixed(1)}s remaining
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto" data-testid="recording-progress-bar">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              data-testid="progress-fill"
              className="bg-red-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, recordingProgress)}%` }}
            ></div>
          </div>
        </div>

        {/* Finishing up warning */}
        {isFinishingUp && (
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg animate-bounce inline-block">
            ⚠️ Finishing up...
          </div>
        )}

        {/* Manual stop button */}
        <button
          onClick={onStopRecording}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
          aria-label="Stop Recording"
        >
          ⏹ Stop Recording
        </button>
      </div>
    </>
  )
}
