'use client';

import { useState, useEffect } from 'react';

interface PreviewModalProps {
  sessionId: string;
  onClose: () => void;
  onDownload: () => void;
}

interface SessionFile {
  path: string;
  type: string;
  word: string | null;
  size: number;
}

interface SessionStats {
  session_id: string;
  lesson_title: string;
  total_files: number;
  total_size_mb: number;
  file_types: Record<string, number>;
  time_remaining: string;
  expires_at: string;
}

export default function PreviewModal({ sessionId, onClose, onDownload }: PreviewModalProps) {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [discarding, setDiscarding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // API URL from environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchPreview();

    // Refresh every 5 seconds to update time remaining
    const interval = setInterval(fetchPreview, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchPreview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/temp/preview/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setStats(data.stats);
      } else if (response.status === 404) {
        alert('Session expired or not found');
        onClose();
      }
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!confirm('Download these files to your device?')) return;

    setDownloading(true);
    try {
      // Fetch the ZIP file from backend
      const response = await fetch(`${API_URL}/api/temp/download-zip/${sessionId}`);

      if (response.ok) {
        // Get the filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'lesson_materials.zip';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Convert response to blob
        const blob = await response.blob();

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(`✅ Files downloaded to your device!\n\nFilename: ${filename}`);
        onDownload();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        alert(`Failed to download: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download files. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this lesson? This cannot be undone.')) return;

    setDiscarding(true);
    try {
      const response = await fetch(`${API_URL}/api/temp/discard/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ Lesson discarded');
        onClose();
      } else {
        alert('Failed to discard lesson');
      }
    } catch (error) {
      console.error('Discard failed:', error);
      alert('Failed to discard lesson');
    } finally {
      setDiscarding(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2E5]"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!session || !stats) {
    return null;
  }

  const filesByType = session.files.reduce((acc: Record<string, SessionFile[]>, file: SessionFile) => {
    if (!acc[file.type]) acc[file.type] = [];
    acc[file.type].push(file);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#00549F]">
              📦 Preview: {stats.lesson_title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Generated {stats.total_files} files ({stats.total_size_mb}MB)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Expiration Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">⏱️ Time remaining: {stats.time_remaining}</span>
                <span className="ml-2">• Files will be auto-deleted after expiration</span>
              </p>
            </div>
          </div>
        </div>

        {/* File Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(stats.file_types).map(([type, count]) => (
            <div key={type} className="bg-gradient-to-br from-[#E6F7FF] to-white border border-[#00A2E5]/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#00549F]">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
            </div>
          ))}
        </div>

        {/* File List */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Generated Files:</h3>

          {Object.entries(filesByType).map(([type, files]) => {
            const fileArray = Array.isArray(files) ? files : [];
            return (
            <div key={type} className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                {type.replace('_', ' ')} ({fileArray.length})
              </h4>
              <div className="space-y-1">
                {fileArray.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
                  >
                    <span className="text-gray-700">
                      {file.word ? (
                        <><span className="font-medium">{file.word.toUpperCase()}</span> - {file.path.split('/').pop()}</>
                      ) : (
                        file.path.split('/').pop()
                      )}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={handleDiscard}
            disabled={discarding || downloading}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {discarding ? 'Discarding...' : '🗑️ Discard'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={downloading || discarding}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading || discarding}
              className="px-6 py-3 bg-gradient-to-r from-[#00A2E5] to-[#00ADEF] text-white font-semibold rounded-lg hover:from-[#0089C2] hover:to-[#00A2E5] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {downloading ? 'Downloading...' : '⬇️ Download ZIP to Device'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
