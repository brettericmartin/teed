'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Loader2,
  Link2,
  Package,
  Trash2,
  AlertTriangle,
  Sparkles,
  Play,
} from 'lucide-react';
import { type AdminRole } from '@/lib/types/admin';
import type { ContentIdeaForAdmin, ExtractedLink } from '@/lib/types/contentIdeas';

interface Props {
  adminRole: AdminRole;
  adminId: string;
  ideaId: string;
}

export default function ContentIdeaDetailClient({ adminRole, adminId, ideaId }: Props) {
  const router = useRouter();
  const [idea, setIdea] = useState<ContentIdeaForAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIdea();
  }, [ideaId]);

  const fetchIdea = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`);
      if (response.ok) {
        const data = await response.json();
        setIdea(data);
      }
    } catch (error) {
      console.error('Failed to fetch idea:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBag = async () => {
    if (!idea) return;

    const extractedLinks = idea.source_metadata?.extractedLinks || [];
    const productLinks = extractedLinks.filter(
      (link: ExtractedLink) => link.productHint || link.label
    );

    if (productLinks.length === 0) {
      alert('No product links found in description. Add links manually in the bag editor.');
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}?action=create-bag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to bag editor
        router.push(`/u/admin/${result.bag.code}/edit`);
      } else {
        const error = await response.json();
        const errorMsg = error.details ? `${error.error}: ${error.details}` : error.error || 'Unknown error';
        alert(`Failed to create bag: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Failed to create bag:', error);
      alert('Failed to create bag. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    if (!confirm('Delete this content idea? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/admin/content-ideas');
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Content idea not found</p>
            <Link href="/admin/content-ideas" className="text-purple-600 hover:underline mt-2 inline-block">
              Back to Content Ideas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const youtube = idea.source_metadata?.youtube;
  const extractedLinks = idea.source_metadata?.extractedLinks || [];
  const productLinks = extractedLinks.filter(
    (link: ExtractedLink) => link.productHint || link.label
  );

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/content-ideas"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>

        {/* Video Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Thumbnail */}
          {(youtube?.thumbnails?.high?.url || youtube?.thumbnails?.medium?.url) && (
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={youtube.thumbnails.high?.url || youtube.thumbnails.medium?.url}
                alt={youtube.title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
              <a
                href={idea.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="bg-white/90 rounded-full p-4">
                  <Play className="w-8 h-8 text-red-600" />
                </div>
              </a>
            </div>
          )}

          {/* Video Details */}
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {youtube?.title || idea.idea_title || 'Untitled Video'}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="font-medium">{idea.source_channel_name || 'Unknown Channel'}</span>
              {youtube?.statistics?.viewCount && (
                <span>{Number(youtube.statistics.viewCount).toLocaleString()} views</span>
              )}
              {youtube?.publishedAt && (
                <span>{new Date(youtube.publishedAt).toLocaleDateString()}</span>
              )}
            </div>

            <a
              href={idea.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
            >
              <ExternalLink className="w-4 h-4" />
              Watch on YouTube
            </a>
          </div>
        </div>

        {/* Bag Status / Create */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {idea.primary_bag_id && idea.primaryBag ? (
            // Bag exists - show link to edit
            <div>
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Bag Created</span>
              </div>
              <p className="text-gray-600 mb-4">{idea.primaryBag.title}</p>
              <div className="flex gap-3">
                <Link
                  href={`/u/${idea.primaryBag.owner?.handle || 'admin'}/${idea.primaryBag.code}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Edit & Enrich Bag
                </Link>
                <Link
                  href={`/u/${idea.primaryBag.owner?.handle || 'admin'}/${idea.primaryBag.code}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </Link>
              </div>
            </div>
          ) : (
            // No bag - show create button
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Create Teed Bag</h2>
              <p className="text-sm text-gray-600 mb-4">
                Create a bag with {productLinks.length} items from description links.
                You'll enrich them with auto-fill and Smart Photo Match.
              </p>
              <button
                onClick={handleCreateBag}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Create Bag from {productLinks.length} Links
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Product Links Found */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-gray-400" />
              Product Links ({productLinks.length})
            </h2>
          </div>

          {productLinks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p>No product links found in description.</p>
              <p className="text-sm mt-1">Links will be extracted from YouTube description text.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {productLinks.map((link: ExtractedLink, index: number) => (
                <div key={index} className="px-6 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {link.productHint || link.label || 'Unknown Product'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{link.domain}</p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-400 hover:text-purple-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  {link.isAffiliate && (
                    <span className="inline-block mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Affiliate
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps Guide (when no bag yet) */}
        {!idea.primary_bag_id && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Create Bag</strong> - Items created from description links above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Auto-Fill Details</strong> - AI enriches brand, description, specs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Smart Photo Match</strong> - Identify products from photos/frames</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span><strong>Publish</strong> - Make the bag public</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}
