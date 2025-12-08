/**
 * Video Contribution Selector
 *
 * Allows users to choose between:
 * 1. Recording with webcam (browser MediaRecorder API)
 * 2. Uploading a pre-recorded video file
 *
 * Both options enforce strict validation rules for quality assurance.
 */

import React, { useState } from 'react';
import { Camera, Upload, Video, AlertCircle, CheckCircle, Info } from 'lucide-react';
import {
  VIDEO_VALIDATION_RULES,
  RECORDING_TIPS
} from '@/lib/videoValidationRules';

interface VideoContributionSelectorProps {
  word: string;
  onMethodSelected: (method: 'webcam' | 'upload') => void;
}

export default function VideoContributionSelector({
  word,
  onMethodSelected,
}: VideoContributionSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'webcam' | 'upload' | null>(null);

  // General recording tips (no longer need classification)
  const generalTips = RECORDING_TIPS.general;

  const handleMethodSelect = (method: 'webcam' | 'upload') => {
    setSelectedMethod(method);
    onMethodSelected(method);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Record Your Sign: <span className="text-indigo-600">{word}</span>
          </h2>
          <p className="text-gray-700 text-sm sm:text-base">
            Choose how you'd like to contribute your sign language video
          </p>
        </div>

        {/* Method Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Webcam Recording Option */}
          <button
            onClick={() => handleMethodSelect('webcam')}
            className={`
              p-4 sm:p-6 rounded-lg border-2 transition-all text-left bg-white shadow-md hover:shadow-lg
              ${selectedMethod === 'webcam'
                ? 'border-indigo-600 ring-2 ring-indigo-200'
                : 'border-gray-300 hover:border-indigo-400'
              }
            `}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`
                p-2 sm:p-3 rounded-full flex-shrink-0
                ${selectedMethod === 'webcam' ? 'bg-indigo-600' : 'bg-gray-200'}
              `}>
                <Camera className={`w-5 h-5 sm:w-6 sm:h-6 ${selectedMethod === 'webcam' ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  Record with Webcam
                </h3>
                <p className="text-sm sm:text-base text-gray-700 mb-3">
                  Use your device's camera to record directly in the browser
                </p>
                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Real-time feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Instant quality check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Multiple retakes allowed</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Upload Video Option */}
          <button
            onClick={() => handleMethodSelect('upload')}
            className={`
              p-4 sm:p-6 rounded-lg border-2 transition-all text-left bg-white shadow-md hover:shadow-lg
              ${selectedMethod === 'upload'
                ? 'border-indigo-600 ring-2 ring-indigo-200'
                : 'border-gray-300 hover:border-indigo-400'
              }
            `}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`
                p-2 sm:p-3 rounded-full flex-shrink-0
                ${selectedMethod === 'upload' ? 'bg-indigo-600' : 'bg-gray-200'}
              `}>
                <Upload className={`w-5 h-5 sm:w-6 sm:h-6 ${selectedMethod === 'upload' ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  Upload Video File
                </h3>
                <p className="text-sm sm:text-base text-gray-700 mb-3">
                  Upload a video you've already recorded on your phone or camera
                </p>
                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Use your phone's camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Better lighting control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span>Edit before uploading</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Validation Requirements */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-md border border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-3">Video Requirements</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>
                    <strong>Duration:</strong> {VIDEO_VALIDATION_RULES.MIN_DURATION}-{VIDEO_VALIDATION_RULES.MAX_DURATION} seconds
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>
                    <strong>Format:</strong> MP4, WebM, or MOV
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>
                    <strong>Max Size:</strong> {VIDEO_VALIDATION_RULES.MAX_FILE_SIZE / 1024 / 1024}MB
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>
                    <strong>Min Quality:</strong> {VIDEO_VALIDATION_RULES.MIN_QUALITY_SCORE * 100}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Tips */}
        <div className="bg-indigo-50 rounded-lg p-4 sm:p-6 border border-indigo-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-3">
                General Recording Tips
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                {generalTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Camera Permission Note for Webcam */}
        {selectedMethod === 'webcam' && (
          <div className="mt-4 sm:mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold text-yellow-900 mb-1">
                  Camera Permission Required
                </p>
                <p className="text-yellow-800">
                  Your browser will ask for camera access. This is required to record your sign.
                  <strong className="block mt-1">
                    We never store your video - it's processed server-side and immediately deleted after extracting the pose data.
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
