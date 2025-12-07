'use client';

/**
 * FeedStats Component
 * Displays community statistics in the sidebar
 */
import { Video, Award, Users, BookOpen } from 'lucide-react';

interface FeedStatsData {
  total_contributions: number;
  gold_standard_count: number;
  needs_review_count: number;
  unique_words: number;
}

interface Props {
  stats: FeedStatsData;
}

export function FeedStats({ stats }: Props) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-[#00549F]" />
        Community Stats
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Video className="w-5 h-5 text-[#00549F]" />
          </div>
          <div className="text-2xl font-bold text-[#00549F]">
            {stats.total_contributions.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Contributions</div>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.gold_standard_count.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Gold Standard</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.unique_words.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Words Covered</div>
        </div>

        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg">👀</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.needs_review_count.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Need Review</div>
        </div>
      </div>
    </div>
  );
}
