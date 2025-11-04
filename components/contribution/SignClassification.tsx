'use client'

import { useState } from 'react'

interface SignClassificationProps {
  word: string
  onComplete: (classification: {
    sign_type_movement: 'static' | 'dynamic'
    sign_type_hands: 'one-handed' | 'two-handed'
  }) => void
  onBack: () => void
}

export default function SignClassification({ word, onComplete, onBack }: SignClassificationProps) {
  const [movement, setMovement] = useState<'static' | 'dynamic' | null>(null)
  const [hands, setHands] = useState<'one-handed' | 'two-handed' | null>(null)

  const handleContinue = () => {
    if (movement && hands) {
      onComplete({
        sign_type_movement: movement,
        sign_type_hands: hands
      })
    }
  }

  const canContinue = movement !== null && hands !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Quick Questions: <span className="text-indigo-600">{word}</span>
          </h1>
          <p className="text-gray-600">
            Help us understand this sign better (this builds our knowledge base)
          </p>
        </div>

        {/* Questions Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">

          {/* Question 1: Movement */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Does this sign involve movement?
              </h2>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              This helps us set the right recording duration expectations
            </p>

            <div className="grid md:grid-cols-2 gap-4 ml-11">
              {/* Static Option */}
              <button
                onClick={() => setMovement('static')}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  movement === 'static'
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    movement === 'static' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {movement === 'static' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Static Sign</div>
                    <div className="text-sm text-gray-600 mb-2">
                      No movement - just a hand position held in place
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Examples:</span> OK sign, Number 1, STOP
                    </div>
                    <div className="text-xs text-indigo-600 font-medium mt-2">
                      Expected duration: 0.5-1 second
                    </div>
                  </div>
                </div>
              </button>

              {/* Dynamic Option */}
              <button
                onClick={() => setMovement('dynamic')}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  movement === 'dynamic'
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    movement === 'dynamic' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {movement === 'dynamic' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Dynamic Sign</div>
                    <div className="text-sm text-gray-600 mb-2">
                      Has movement - hands move through space
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Examples:</span> HELLO (wave), COME, GO
                    </div>
                    <div className="text-xs text-indigo-600 font-medium mt-2">
                      Expected duration: 1-3 seconds
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Question 2: Hands */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Does this sign use one hand or two hands?
              </h2>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              This helps us score the correct hand visibility
            </p>

            <div className="grid md:grid-cols-2 gap-4 ml-11">
              {/* One-handed Option */}
              <button
                onClick={() => setHands('one-handed')}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  hands === 'one-handed'
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    hands === 'one-handed' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {hands === 'one-handed' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">One-Handed Sign</div>
                    <div className="text-sm text-gray-600 mb-2">
                      Only one hand is actively used
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Examples:</span> Numbers 1-10, I, YOU, HE/SHE
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      ~40% of all signs are one-handed
                    </div>
                  </div>
                </div>
              </button>

              {/* Two-handed Option */}
              <button
                onClick={() => setHands('two-handed')}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  hands === 'two-handed'
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    hands === 'two-handed' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {hands === 'two-handed' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Two-Handed Sign</div>
                    <div className="text-sm text-gray-600 mb-2">
                      Both hands are used together
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Examples:</span> SAME, MEET, HELP, WORK
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      ~60% of all signs are two-handed
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all duration-200"
          >
            ← Back to Reference
          </button>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 ${
              canContinue
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to Recording →
          </button>
        </div>

        {/* Help Text */}
        {!canContinue && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Please answer both questions to continue
          </p>
        )}
      </div>
    </div>
  )
}
