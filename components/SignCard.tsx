'use client'

import Image from 'next/image';
import { SignSearchResult } from '@/lib/api';
import CorrectionPanel from './CorrectionPanel';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SkeletonPreview (no SSR)
const SkeletonPreview = dynamic(
  () => import('./contribution/SkeletonPreview'),
  { ssr: false }
);

interface SignCardProps {
  result: SignSearchResult;
  imageUrl: string;
  query: string;
}

interface AverageSkeletonData {
  word: string;
  num_contributions: number;
  avg_quality_score: number;
  frames: any[];
}

export default function SignCard({ result, imageUrl, query }: SignCardProps) {
  const [averageFrames, setAverageFrames] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const confidencePercent = (result.confidence * 100).toFixed(1);
  const confidenceColor = result.confidence > 0.7 ? 'text-green-700' :
                         result.confidence > 0.5 ? 'text-yellow-700' :
                         'text-orange-700';

  // Fetch average skeleton data
  useEffect(() => {
    const fetchAverageSkeleton = async () => {
      try {
        const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000').trim();
        const response = await fetch(`${API_URL}/api/contributions/${result.metadata.matched_word}/average`);

        if (response.ok) {
          const data: AverageSkeletonData = await response.json();
          if (data.frames && data.frames.length > 0) {
            setAverageFrames(data.frames);
          }
        }
      } catch (error) {
        console.error('Failed to load average skeleton:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAverageSkeleton();
  }, [result.metadata.matched_word]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-2xl hover:border-[#00A2E5]/30 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] p-3 sm:p-4 text-white">
        <h2 className="text-xl sm:text-2xl font-bold">{result.metadata.matched_word}</h2>
        <p className="text-xs sm:text-sm text-white/90">Category: {result.metadata.category}</p>
      </div>

      {/* Sign Image and Skeleton Comparison */}
      <div className="bg-gray-50 border-b border-gray-100">
        {/* Toggle Tabs */}
        {averageFrames && (
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setShowSkeleton(false)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                !showSkeleton
                  ? 'bg-[#E6F7FF] text-[#00549F] border-b-2 border-[#00A2E5]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📖 Reference Sign
            </button>
            <button
              onClick={() => setShowSkeleton(true)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                showSkeleton
                  ? 'bg-[#E6F7FF] text-[#00549F] border-b-2 border-[#00A2E5]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🎥 Community Average
            </button>
          </div>
        )}

        {/* Content */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center justify-center p-4 sm:p-6">
          {!showSkeleton ? (
            <Image
              src={imageUrl}
              alt={`Sign for ${result.metadata.matched_word}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : averageFrames ? (
            <SkeletonPreview
              frames={averageFrames}
              isPlaying={true}
              frameRate={30}
              showControls={true}
            />
          ) : null}
        </div>

        {/* Info Badge */}
        {showSkeleton && averageFrames && (
          <div className="px-4 pb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-green-900 font-medium">
                🌟 Averaged from community contributions
              </p>
              <p className="text-green-700 text-xs mt-1">
                This is the average skeleton motion from all user recordings
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 sm:p-6 space-y-3 bg-white">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 font-medium">Confidence:</span>
          <span className={`text-lg font-bold ${confidenceColor}`}>
            {confidencePercent}%
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[#E6F7FF] rounded-lg">
          <span className="text-sm text-[#00549F] font-medium">Dictionary Page:</span>
          <span className="text-sm font-bold text-[#00549F]">
            Page {result.metadata.page}
          </span>
        </div>

        <div className="pt-2 border-t-2 border-gray-100">
          <p className="text-xs text-gray-600 text-center font-medium">
            {result.metadata.source}
          </p>
        </div>

        {/* Human-in-the-Loop Correction Panel */}
        <div className="pt-3 border-t-2 border-gray-100">
          <CorrectionPanel result={result} query={query} />
        </div>

        {/* Contribute CTA */}
        <div className="pt-3">
          <a
            href={`/contribute?word=${encodeURIComponent(result.metadata.matched_word)}`}
            className="block w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-center group"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">🎥</span>
              <span>Help improve "{result.metadata.matched_word}"</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <span className="block text-xs text-green-100 mt-1">Record yourself signing to train the AI</span>
          </a>
        </div>
      </div>
    </div>
  );
}
