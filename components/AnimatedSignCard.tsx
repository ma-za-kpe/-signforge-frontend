'use client';

/**
 * 🎬 ANIMATED SIGN CARD
 *
 * Hover-activated preview card that shows animated skeleton
 * when teacher hovers over a word in the lesson editor.
 *
 * Features:
 * - Hover to activate animation
 * - Static image preview by default
 * - Smooth transitions
 * - Click to select/deselect
 */

import { useState } from 'react';
import AnimatedSignPreview from './AnimatedSignPreview';

interface AnimatedSignCardProps {
  word: string;
  signImage: string;
  selected: boolean;
  onToggle: () => void;
  apiUrl: string;
}

export default function AnimatedSignCard({
  word,
  signImage,
  selected,
  onToggle,
  apiUrl
}: AnimatedSignCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Show animation after hover delay (500ms)
  const handleMouseEnter = () => {
    setIsHovering(true);
    const timer = setTimeout(() => {
      if (isHovering) setShowAnimation(true);
    }, 500);

    return () => clearTimeout(timer);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowAnimation(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onToggle}
      className={`relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-[#00A2E5] bg-[#E6F7FF] shadow-lg'
          : 'border-gray-200 hover:border-[#00A2E5]/50 hover:shadow-md'
      }`}
    >
      {/* Left: Checkbox and word info */}
      <div className="flex items-center space-x-3 flex-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="w-5 h-5 text-[#00A2E5] rounded focus:ring-[#00A2E5]"
        />
        <div>
          <div className="font-semibold text-gray-900 capitalize">
            {word}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>✅ Sign available</span>
            {isHovering && <span className="text-purple-600">• 🎬 Hover to preview</span>}
          </div>
        </div>
      </div>

      {/* Right: Static image or animated preview */}
      <div className="relative">
        {showAnimation ? (
          <div className="relative">
            {/* Animated skeleton preview */}
            <AnimatedSignPreview
              word={word}
              autoPlay={true}
              className="w-32 h-32 shadow-xl border-4 border-purple-500"
            />
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
          </div>
        ) : (
          // Static sign image
          <div className="relative group">
            <img
              src={`${apiUrl}${signImage}`}
              alt={word}
              className={`w-16 h-16 object-contain rounded border-2 transition-all ${
                isHovering ? 'border-purple-400 scale-110' : 'border-gray-200'
              }`}
            />
            {isHovering && (
              <div className="absolute -top-8 right-0 bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Hold to see animation
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI badge when animating */}
      {showAnimation && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
          🤖 AI LIVE
        </div>
      )}
    </div>
  );
}
