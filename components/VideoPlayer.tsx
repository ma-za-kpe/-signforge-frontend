'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  onDownload?: () => void
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  playbackRate?: number
  showSpeedControl?: boolean
}

export default function VideoPlayer({
  src,
  poster,
  className = '',
  onDownload,
  autoPlay = false,
  loop = true,
  muted = true,
  controls = true,
  playbackRate = 0.75,
  showSpeedControl = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [speed, setSpeed] = useState(playbackRate)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const updateDuration = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  // Apply playback rate
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
  }, [speed])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        onClick={togglePlay}
      />

      {/* Custom Controls Overlay */}
      {controls && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer hover:h-2 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="hover:scale-110 transition-transform"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleMute}
                className="hover:scale-110 transition-transform"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {showSpeedControl && (
                <div className="flex items-center gap-1 bg-black/50 rounded px-2 py-1">
                  <button
                    onClick={() => setSpeed(0.5)}
                    className={`text-xs px-2 py-1 rounded transition ${speed === 0.5 ? 'bg-purple-500' : 'hover:bg-white/10'}`}
                  >
                    0.5x
                  </button>
                  <button
                    onClick={() => setSpeed(0.75)}
                    className={`text-xs px-2 py-1 rounded transition ${speed === 0.75 ? 'bg-purple-500' : 'hover:bg-white/10'}`}
                  >
                    0.75x
                  </button>
                  <button
                    onClick={() => setSpeed(1)}
                    className={`text-xs px-2 py-1 rounded transition ${speed === 1 ? 'bg-purple-500' : 'hover:bg-white/10'}`}
                  >
                    1x
                  </button>
                </div>
              )}

              {onDownload && (
                <button
                  onClick={onDownload}
                  className="hover:scale-110 transition-transform"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="hover:scale-110 transition-transform"
                aria-label="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
