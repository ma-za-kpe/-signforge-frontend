/**
 * Contribution Preview Modal
 *
 * Displays full contribution details with skeleton visualization
 * Allows admin to preview, edit, or delete contributions
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import SkeletonPreview from '../contribution/SkeletonPreview';
import toast from 'react-hot-toast';

interface ContributionPreviewModalProps {
  contributionId: number;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

interface ContributionDetail {
  id: number;
  word: string;
  user_id: string;
  duration: number;
  quality_score: number;
  num_frames: number;
  fps: number;
  data_points: number;
  has_left_hand: boolean;
  has_right_hand: boolean;
  created_at: string;
  metadata: any;
  pose_sequence: number[][][];
  quality_breakdown?: {
    hand_visibility?: number;
    motion_smoothness?: number;
    frame_completeness?: number;
    lighting_quality?: number;
  };
}

export default function ContributionPreviewModal({
  contributionId,
  onClose,
  onDeleted,
  onUpdated
}: ContributionPreviewModalProps) {
  const [contribution, setContribution] = useState<ContributionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedWord, setEditedWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

  // Fetch contribution details
  useEffect(() => {
    const fetchContribution = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/ama/contributions/${contributionId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch contribution: ${response.statusText}`);
        }

        const data = await response.json();
        setContribution(data);
        setEditedWord(data.word);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contribution');
        toast.error('Failed to load contribution details');
      } finally {
        setLoading(false);
      }
    };

    fetchContribution();
  }, [contributionId, API_URL]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${contribution?.word} contribution? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${API_URL}/api/ama/contributions/${contributionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contribution');
      }

      toast.success('Contribution deleted successfully');
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error('Failed to delete contribution');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle update
  const handleSave = async () => {
    if (editedWord.trim() === '') {
      toast.error('Word cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/api/ama/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: editedWord.trim(),
          metadata: {
            ...contribution?.metadata,
            edited: true,
            edited_at: new Date().toISOString(),
            original_word: contribution?.word
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contribution');
      }

      const updated = await response.json();
      setContribution({ ...contribution!, word: updated.word });
      setIsEditing(false);
      toast.success('Contribution updated successfully');
      onUpdated?.();
    } catch (err) {
      toast.error('Failed to update contribution');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading contribution details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contribution) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
            <p className="text-gray-900 font-semibold">Failed to load contribution</p>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedWord}
                  onChange={(e) => setEditedWord(e.target.value.toUpperCase())}
                  className="text-2xl font-bold border-2 border-blue-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedWord(contribution.word);
                  }}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900">{contribution.word}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit word"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Skeleton Visualization */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold text-gray-900">Pose Visualization</h3>
              <SkeletonPreview
                frames={contribution.pose_sequence}
                isPlaying={false}
              />
            </div>

            {/* Right Column - Details */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contribution Details</h3>

                <div className="space-y-3">
                  <DetailRow label="User ID" value={contribution.user_id} />
                  <DetailRow label="Created" value={new Date(contribution.created_at).toLocaleString()} />
                  <DetailRow label="Duration" value={`${contribution.duration.toFixed(2)}s`} />
                  <DetailRow label="Frames" value={contribution.num_frames.toString()} />
                  <DetailRow label="FPS" value={contribution.fps.toFixed(1)} />
                  <DetailRow label="Data Points" value={contribution.data_points.toLocaleString()} />

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">Quality Score</span>
                    <span className={`text-lg font-bold ${
                      contribution.quality_score >= 0.8 ? 'text-green-600' :
                      contribution.quality_score >= 0.6 ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {(contribution.quality_score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <DetailRow
                    label="Hand Detection"
                    value={
                      <div className="flex gap-2">
                        {contribution.has_left_hand && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Left ✓</span>
                        )}
                        {contribution.has_right_hand && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Right ✓</span>
                        )}
                        {!contribution.has_left_hand && !contribution.has_right_hand && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">None</span>
                        )}
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Quality Breakdown */}
              {contribution.quality_breakdown && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Breakdown</h3>
                  <div className="space-y-2">
                    {contribution.quality_breakdown.hand_visibility !== undefined && (
                      <QualityBar label="Hand Visibility" value={contribution.quality_breakdown.hand_visibility} />
                    )}
                    {contribution.quality_breakdown.motion_smoothness !== undefined && (
                      <QualityBar label="Motion Smoothness" value={contribution.quality_breakdown.motion_smoothness} />
                    )}
                    {contribution.quality_breakdown.frame_completeness !== undefined && (
                      <QualityBar label="Frame Completeness" value={contribution.quality_breakdown.frame_completeness} />
                    )}
                    {contribution.quality_breakdown.lighting_quality !== undefined && (
                      <QualityBar label="Lighting Quality" value={contribution.quality_breakdown.lighting_quality} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>Delete Contribution</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function QualityBar({ label, value }: { label: string; value: number }) {
  const percentage = value * 100;
  const color = value >= 0.8 ? 'bg-green-500' : value >= 0.6 ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
