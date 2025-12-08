'use client';

/**
 * ContributionCard Component
 * Displays a single contribution in the feed with voting, video, and metadata
 */
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageCircle, Flag, Share2, Award } from 'lucide-react';
import { useAuthGate } from '@/components/auth/useAuthGate';
import SkeletonVisualizer from '@/components/SkeletonVisualizer';

interface ContributionItem {
  id: number;
  contribution_id: string;
  word: string;
  user_id: string | null;
  quality_score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_gold_standard: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  user_region: string | null;
  frames_data?: number[][] | null;  // Skeleton pose data for fallback display
}

interface Props {
  item: ContributionItem;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

// Transform API frames_data to SkeletonVisualizer format
// API format: [{frame_number, pose_landmarks: [{x,y,z,visibility}...], left_hand_landmarks, right_hand_landmarks}]
// Skeleton format: [[x,y,z,visibility]...] per frame (75 landmarks: 33 pose + 21 left + 21 right)
function transformFramesData(framesData: any[]): number[][][] {
  if (!framesData || !Array.isArray(framesData)) return [];

  return framesData.map(frame => {
    const landmarks: number[][] = [];

    // Add pose landmarks (33 points)
    if (frame.pose_landmarks && Array.isArray(frame.pose_landmarks)) {
      frame.pose_landmarks.forEach((p: any) => {
        landmarks.push([p.x || 0, p.y || 0, p.z || 0, p.visibility ?? 0.9]);
      });
    }

    // Add left hand landmarks (21 points)
    if (frame.left_hand_landmarks && Array.isArray(frame.left_hand_landmarks)) {
      frame.left_hand_landmarks.forEach((p: any) => {
        landmarks.push([p.x || 0, p.y || 0, p.z || 0, p.visibility ?? 0.9]);
      });
    }

    // Add right hand landmarks (21 points)
    if (frame.right_hand_landmarks && Array.isArray(frame.right_hand_landmarks)) {
      frame.right_hand_landmarks.forEach((p: any) => {
        landmarks.push([p.x || 0, p.y || 0, p.z || 0, p.visibility ?? 0.9]);
      });
    }

    return landmarks;
  });
}

export function ContributionCard({ item }: Props) {
  const [upvotes, setUpvotes] = useState(item.upvotes);
  const [downvotes, setDownvotes] = useState(item.downvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);
  const [voteLoaded, setVoteLoaded] = useState(false);

  // Auth gate for voting and flagging
  const { requireAuth, AuthModal, user, isAuthenticated } = useAuthGate();

  // Get user ID for voting - use email as unique identifier
  const userId = user?.email || user?.id || null;

  // Load existing user vote on mount
  useEffect(() => {
    if (!userId || voteLoaded) return;

    const loadUserVote = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/votes/${item.contribution_id}?user_id=${encodeURIComponent(userId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.vote_type === 1) {
            setUserVote('up');
          } else if (data.vote_type === -1) {
            setUserVote('down');
          }
        }
      } catch (err) {
        console.error('Failed to load user vote:', err);
      } finally {
        setVoteLoaded(true);
      }
    };

    loadUserVote();
  }, [userId, item.contribution_id, voteLoaded]);

  const netVotes = upvotes - downvotes;
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  const handleVote = async (voteType: 'up' | 'down') => {
    // Auth gate - require login to vote
    if (!requireAuth('vote on contributions')) return;

    if (isVoting || !userId) return;
    setIsVoting(true);

    // Optimistic update
    const previousVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    const isUndo = userVote === voteType;

    if (isUndo) {
      // Undo vote
      setUserVote(null);
      if (voteType === 'up') setUpvotes(u => u - 1);
      else setDownvotes(d => d - 1);
    } else {
      // New vote or change vote
      if (userVote === 'up') setUpvotes(u => u - 1);
      if (userVote === 'down') setDownvotes(d => d - 1);
      setUserVote(voteType);
      if (voteType === 'up') setUpvotes(u => u + 1);
      else setDownvotes(d => d + 1);
    }

    try {
      if (isUndo) {
        // Remove vote
        const res = await fetch(
          `${API_URL}/api/votes/${item.contribution_id}?user_id=${encodeURIComponent(userId)}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error('Failed to remove vote');
      } else {
        // Create or update vote
        const res = await fetch(`${API_URL}/api/votes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contribution_id: item.contribution_id,
            vote_type: voteType === 'up' ? 1 : -1,
            user_id: userId
          })
        });
        if (!res.ok) throw new Error('Failed to vote');
      }
    } catch (error) {
      // Revert on error
      setUserVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleFlag = () => {
    // Auth gate - require login to flag
    if (!requireAuth('report content')) return;
    setShowFlagConfirm(true);
  };

  const handleComment = () => {
    // Auth gate - require login to comment
    if (!requireAuth('comment on contributions')) return;
    // TODO: Open comment modal/section
    alert('Comments coming soon!');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/contribution/${item.contribution_id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sign for "${item.word}" - SignTube`,
          url
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* User Avatar */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#00549F] to-[#00A2E5] flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
              {item.user_id?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {item.user_id ? (
                  <a
                    href={`/u/${encodeURIComponent(item.user_id)}`}
                    className="font-medium text-gray-900 hover:text-[#00549F] text-sm sm:text-base truncate transition-colors"
                  >
                    {item.user_id}
                  </a>
                ) : (
                  <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    Anonymous
                  </span>
                )}
                {item.is_gold_standard && (
                  <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs font-medium rounded-full">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Gold
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                <span>{timeAgo}</span>
                {item.user_region && (
                  <>
                    <span className="hidden xs:inline">•</span>
                    <span className="hidden xs:inline">{item.user_region}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quality Score Badge */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm font-medium flex-shrink-0">
            <span>{Math.round(item.quality_score)}%</span>
            <span className="hidden sm:inline text-[10px] sm:text-xs text-blue-500">quality</span>
          </div>
        </div>

        {/* Word Label */}
        <div className="mt-2 sm:mt-3">
          <span className="inline-block px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#00549F] text-white font-bold rounded-lg text-base sm:text-lg">
            {item.word}
          </span>
        </div>
      </div>

      {/* Video/Thumbnail */}
      <div className="relative bg-gray-100">
        {item.video_url ? (
          showVideo ? (
            <video
              src={`${API_URL}${item.video_url}`}
              controls
              autoPlay
              className="w-full aspect-video object-contain bg-black"
            />
          ) : (
            <button
              onClick={() => setShowVideo(true)}
              className="w-full aspect-video flex items-center justify-center bg-gray-900 group"
            >
              {item.thumbnail_url ? (
                <img
                  src={`${API_URL}${item.thumbnail_url}`}
                  alt={`Sign for ${item.word}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm">Click to play</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#00549F] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )
        ) : item.frames_data && item.frames_data.length > 0 ? (
          /* Show skeleton animation when no video but has pose data */
          <div className="w-full aspect-video">
            <SkeletonVisualizer
              poseData={transformFramesData(item.frames_data)}
              playing={true}
              fps={15}
              word={item.word}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No video</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 sm:p-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Upvote */}
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
              userVote === 'up'
                ? 'bg-green-100 text-green-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${userVote === 'up' ? 'fill-current' : ''}`} />
            <span className="font-medium text-sm sm:text-base">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('down')}
            disabled={isVoting}
            className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
              userVote === 'down'
                ? 'bg-red-100 text-red-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 sm:w-5 sm:h-5 ${userVote === 'down' ? 'fill-current' : ''}`} />
            <span className="font-medium text-sm sm:text-base">{downvotes}</span>
          </button>

          {/* Net score */}
          <div className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-bold ${
            netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {netVotes > 0 ? '+' : ''}{netVotes}
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Comments */}
          <button
            onClick={handleComment}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">{item.comment_count}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Flag */}
          <button
            onClick={handleFlag}
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Report"
          >
            <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Auth Modal for login prompts */}
      <AuthModal />

      {/* Flag Confirmation Modal */}
      {showFlagConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFlagConfirm(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report this content?</h3>
            <p className="text-gray-600 mb-4">
              Flag this contribution for review by moderators.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFlagConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement flag API
                  setShowFlagConfirm(false);
                  alert('Thank you for reporting. Our team will review this content.');
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
