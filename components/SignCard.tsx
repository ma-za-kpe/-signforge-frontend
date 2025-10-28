import Image from 'next/image';
import { SignSearchResult } from '@/lib/api';
import CorrectionPanel from './CorrectionPanel';

interface SignCardProps {
  result: SignSearchResult;
  imageUrl: string;
  query: string;
}

export default function SignCard({ result, imageUrl, query }: SignCardProps) {
  const confidencePercent = (result.confidence * 100).toFixed(1);
  const confidenceColor = result.confidence > 0.7 ? 'text-green-700' :
                         result.confidence > 0.5 ? 'text-yellow-700' :
                         'text-orange-700';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-2xl hover:border-[#00A2E5]/30 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] p-3 sm:p-4 text-white">
        <h2 className="text-xl sm:text-2xl font-bold">{result.metadata.matched_word}</h2>
        <p className="text-xs sm:text-sm text-white/90">Category: {result.metadata.category}</p>
      </div>

      {/* Sign Image */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        <Image
          src={imageUrl}
          alt={`Sign for ${result.metadata.matched_word}`}
          fill
          className="object-contain p-4 sm:p-6"
          unoptimized
        />
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
      </div>
    </div>
  );
}
