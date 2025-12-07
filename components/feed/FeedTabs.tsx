'use client';

/**
 * FeedTabs Component
 * Tab navigation for feed (New, Trending, Gold, Needs Review)
 */
import { Flame, Clock, Award, Eye } from 'lucide-react';

type FeedTab = 'new' | 'trending' | 'gold' | 'needs_review';

interface Props {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const tabs: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
  { id: 'new', label: 'New', icon: <Clock className="w-4 h-4" /> },
  { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
  { id: 'gold', label: 'Gold', icon: <Award className="w-4 h-4" /> },
  { id: 'needs_review', label: 'Review', icon: <Eye className="w-4 h-4" /> },
];

export function FeedTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="bg-white rounded-lg mb-4 p-1 flex gap-1 border border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md font-medium text-sm transition-colors ${
            activeTab === tab.id
              ? 'bg-[#00549F] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
