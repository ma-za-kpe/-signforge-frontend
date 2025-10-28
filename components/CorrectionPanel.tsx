'use client';

import { useState } from 'react';
import { SignSearchResult } from '@/lib/api';
import { flagResult, getAlternatives, AlternativeResult } from '@/lib/api';
import Image from 'next/image';

interface CorrectionPanelProps {
  result: SignSearchResult;
  query: string;
  onAlternativeSelected?: (alternative: AlternativeResult) => void;
}

export default function CorrectionPanel({ result, query, onAlternativeSelected }: CorrectionPanelProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [comment, setComment] = useState('');

  // Auto-show feedback panel if confidence is low
  const isLowConfidence = result.confidence < 0.7;

  const handleCorrectFeedback = async () => {
    setLoading(true);
    try {
      await flagResult({
        query,
        returned_word: result.metadata.matched_word,
        is_correct: true,
        confidence_score: result.confidence,
      });
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncorrectFeedback = async () => {
    setShowFeedback(true);
  };

  const handleViewAlternatives = async () => {
    if (alternatives.length > 0) {
      setShowAlternatives(!showAlternatives);
      return;
    }

    setLoading(true);
    try {
      const response = await getAlternatives(query);
      setAlternatives(response.alternatives);
      setShowAlternatives(true);
    } catch (error) {
      console.error('Failed to get alternatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCorrection = async (correctWord?: string) => {
    setLoading(true);
    try {
      await flagResult({
        query,
        returned_word: result.metadata.matched_word,
        is_correct: false,
        correct_word: correctWord,
        user_comment: comment,
        confidence_score: result.confidence,
      });
      setFeedbackSubmitted(true);
      setShowFeedback(false);
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit correction:', error);
    } finally {
      setLoading(false);
      setComment('');
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Low Confidence Warning */}
      {isLowConfidence && !feedbackSubmitted && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Confidence Result
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This result has a confidence score below 70%. Please verify if it's correct.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {feedbackSubmitted && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">
              Thank you! Your feedback helps improve the system.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Buttons */}
      {!feedbackSubmitted && !showFeedback && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium text-gray-700">Was this result helpful?</span>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button
              onClick={handleCorrectFeedback}
              disabled={loading}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 min-h-[44px] flex items-center justify-center"
            >
              ✓ Yes, correct
            </button>
            <button
              onClick={handleIncorrectFeedback}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 min-h-[44px] flex items-center justify-center"
            >
              ✗ No, incorrect
            </button>
            <button
              onClick={handleViewAlternatives}
              disabled={loading}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 min-h-[44px] flex items-center justify-center"
            >
              {showAlternatives ? '↑ Hide' : '↓ Show'} Alternatives
            </button>
          </div>
        </div>
      )}

      {/* Correction Form */}
      {showFeedback && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-red-900">Help us improve</h3>
          <p className="text-sm text-red-800">
            If you know the correct word, please enter it below. Otherwise, just submit your feedback.
          </p>

          <div>
            <label className="block text-sm font-medium text-red-900 mb-1">
              Correct word (optional):
            </label>
            <input
              type="text"
              placeholder="Enter correct word..."
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleSubmitCorrection(e.currentTarget.value);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-900 mb-1">
              Comment (optional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any additional feedback..."
              rows={2}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSubmitCorrection()}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alternatives Panel */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">
            Alternative Matches for "{query}"
          </h3>
          <div className="grid gap-3">
            {alternatives.map((alt, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg p-3 border transition-all cursor-pointer ${
                  index === 0
                    ? 'border-blue-400 border-2'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => {
                  if (onAlternativeSelected) {
                    onAlternativeSelected(alt);
                  }
                  handleSubmitCorrection(alt.word);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-16 h-16 relative bg-gray-100 rounded">
                    <Image
                      src={`http://localhost:9000${alt.sign_image}`}
                      alt={alt.word}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {index === 0 && '🌟 '}
                        {alt.word}
                      </h4>
                      <span className="text-sm font-medium text-gray-600">
                        {(alt.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-600">
                      <span>Rank: #{alt.rank}</span>
                      <span>Page {alt.page}</span>
                      <span>{alt.category}</span>
                    </div>
                  </div>
                  <div>
                    <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-3">
            💡 Click on an alternative to report it as the correct match
          </p>
        </div>
      )}
    </div>
  );
}
