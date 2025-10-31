'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ReferencePlayerProps {
  word: string
  signImageUrl: string
  onReady: () => void
}

export default function ReferencePlayer({ word, signImageUrl, onReady }: ReferencePlayerProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Learn the Sign: <span className="text-indigo-600">{word}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Study this reference before recording your contribution
          </p>
        </div>

        {/* Reference Image */}
        <div className="relative bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 md:mb-8 flex items-center justify-center" style={{ minHeight: '250px' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-600"></div>
            </div>
          )}

          <Image
            src={signImageUrl}
            alt={`Ghana Sign Language sign for ${word}`}
            width={600}
            height={600}
            className="object-contain"
            onLoad={() => setImageLoaded(true)}
            priority
          />
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-indigo-900 mb-3 sm:mb-4">
            📝 Recording Tips:
          </h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Position yourself in <strong>good lighting</strong> with a clear background</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Ensure your <strong>hands and face are clearly visible</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Perform the sign <strong>naturally</strong> as you would in conversation</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>The recording will be <strong>2 seconds</strong> long with a 5-second countdown</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">🔒</span>
              <span><strong>Privacy:</strong> Only motion data is captured, not your video!</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={onReady}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 sm:py-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
        >
          I Understand - Start Contributing 🎥
        </button>

        {/* Info Footer */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>
            Your contribution will help train AI to generate authentic Ghana Sign Language videos
          </p>
        </div>
      </div>
    </div>
  )
}
