'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Link2,
  Loader2,
  Play,
  Sparkles,
  ExternalLink,
  Eye,
  ThumbsUp,
  Clock,
  Package,
  CheckCircle,
} from 'lucide-react';
import { type AdminRole } from '@/lib/types/admin';
import type { ContentVertical } from '@/lib/types/contentIdeas';
import { VERTICAL_DISPLAY_NAMES } from '@/lib/types/contentIdeas';

interface Props {
  adminRole: AdminRole;
}

interface AnalysisResult {
  success: boolean;
  savedIdeaId?: string;
  alreadyExists: boolean;
  videoInfo: {
    title: string;
    channel: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    duration: string;
    thumbnailUrl: string;
    url: string;
  };
  productLinksCount: number;
  hasCreatorAffiliate?: boolean;
}

export default function AnalyzeUrlClient({ adminRole }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [vertical, setVertical] = useState<ContentVertical>('tech');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/content-ideas/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, vertical, saveToDatabase: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Analysis failed';
        throw new Error(errorMsg);
      }

      setResult(data);

      // Auto-redirect to detail page after short delay
      if (data.savedIdeaId) {
        setTimeout(() => {
          router.push(`/admin/content-ideas/${data.savedIdeaId}`);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const formatViewCount = (count: string): string => {
    const num = parseInt(count, 10);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return count;
  };

  const formatDuration = (isoDuration: string): string => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? `${match[1]}:` : '';
    const minutes = match[2] || '0';
    const seconds = match[3]?.padStart(2, '0') || '00';
    return `${hours}${minutes}:${seconds}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content-ideas"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Ideas
          </Link>

          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add YouTube Video</h1>
              <p className="text-gray-600">
                Paste a video URL to create a Teed bag from description links
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value as ContentVertical)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              >
                {Object.entries(VERTICAL_DISPLAY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching Video...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Add Video
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Result - Quick Preview */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Success Message */}
            <div className="p-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  {result.alreadyExists ? 'Video already saved' : 'Video saved successfully'}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Redirecting to detail page...
              </p>
            </div>

            {/* Video Preview */}
            <div className="p-6">
              <div className="flex gap-4">
                <a
                  href={result.videoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 relative group"
                >
                  <img
                    src={result.videoInfo.thumbnailUrl}
                    alt=""
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </a>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {result.videoInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{result.videoInfo.channel}</p>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(result.videoInfo.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {formatViewCount(result.videoInfo.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(result.videoInfo.duration)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm text-purple-600">
                      <Package className="w-4 h-4" />
                      {result.productLinksCount} product links found
                    </span>
                    {result.hasCreatorAffiliate && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Has affiliate links
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result.savedIdeaId && (
                <Link
                  href={`/admin/content-ideas/${result.savedIdeaId}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Continue to Create Bag
                </Link>
              )}
            </div>
          </div>
        )}

        {/* How it works */}
        {!result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How it works</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Paste URL</strong> - We fetch video info and extract links from description</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Create Bag</strong> - One click to create a bag with items from links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Enrich Items</strong> - Use Auto-Fill and Smart Photo Match in bag editor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span><strong>Publish</strong> - Make the bag public when ready</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}
