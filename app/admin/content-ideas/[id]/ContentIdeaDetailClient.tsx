'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Play,
  CheckCircle,
  Clock,
  Archive,
  XCircle,
  Sparkles,
  Loader2,
  Save,
  Copy,
  Link2,
  Package,
  Edit2,
  Video,
  MessageSquare,
  FileText,
  Scissors,
  Hash,
  User,
  Users,
  Star,
  ShoppingBag,
  Cpu,
} from 'lucide-react';
import { TeamGenerationPanel } from './components/TeamGenerationPanel';
import type { TeamGenerationOutput } from '@/lib/types/teamGeneration';
import { type AdminRole, ROLE_PERMISSIONS } from '@/lib/types/admin';
import type {
  ContentIdea,
  ContentIdeaStatus,
  HookOption,
  LongFormOutline,
  ShortFormIdea,
  ContentIdeaForAdmin,
  ExtractedProduct,
} from '@/lib/types/contentIdeas';
import {
  STATUS_DISPLAY_NAMES,
  STATUS_COLORS,
  VERTICAL_DISPLAY_NAMES,
} from '@/lib/types/contentIdeas';

// Client-side video content type detection (mirrors server logic)
function detectVideoContentType(title: string, productCount: number): 'single_hero' | 'roundup' | 'comparison' {
  const titleLower = title.toLowerCase();

  // Single-item title patterns
  const singleItemPatterns = [
    /review/i, /unboxing/i, /hands[- ]?on/i, /first\s*(look|impressions)/i,
    /testing/i, /abusing/i, /breaking/i, /one\s*(year|month|week)\s*(later|with)/i,
    /long[- ]?term/i, /honest\s*(thoughts|review)/i, /is\s*(it|the)\s+worth/i,
    /should\s+you\s+(buy|get)/i, /why\s+i\s+(bought|got|switched)/i,
    /my\s+new/i, /finally\s+got/i, /switching\s+to/i,
  ];

  if (singleItemPatterns.some(p => p.test(titleLower))) {
    return 'single_hero';
  }

  // Roundup patterns
  const roundupPatterns = [
    /\d+\s*(best|top|must[- ]?have|essential|favorite)/i,
    /best\s*\d+/i, /top\s*\d+/i, /roundup/i, /picks/i, /list/i,
    /gear\s*guide/i, /buyer'?s?\s*guide/i,
  ];

  if (roundupPatterns.some(p => p.test(titleLower))) {
    return 'roundup';
  }

  // Comparison patterns
  if (/\bvs\.?\b/i.test(titleLower) || /versus/i.test(titleLower) || /compared/i.test(titleLower)) {
    return 'comparison';
  }

  // Default based on product count
  return productCount >= 5 ? 'roundup' : 'single_hero';
}

interface Props {
  adminRole: AdminRole;
  adminId: string;
  ideaId: string;
}

export default function ContentIdeaDetailClient({ adminRole, adminId, ideaId }: Props) {
  const [idea, setIdea] = useState<ContentIdeaForAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'hooks' | 'longform' | 'shortform'>('overview');
  const [teamGeneration, setTeamGeneration] = useState<{
    id: string;
    status: string;
    final_output?: TeamGenerationOutput;
    created_at: string;
  } | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedCreatorStory, setEditedCreatorStory] = useState('');
  const [editedAudienceStory, setEditedAudienceStory] = useState('');

  const permissions = ROLE_PERMISSIONS[adminRole];

  useEffect(() => {
    fetchIdea();
    fetchTeamGeneration();
  }, [ideaId]);

  const fetchIdea = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`);
      if (response.ok) {
        const data = await response.json();
        setIdea(data);
        setEditedTitle(data.idea_title || '');
        setEditedSummary(data.idea_summary || '');
        setEditedCreatorStory(data.why_interesting_to_creator || '');
        setEditedAudienceStory(data.why_interesting_to_audience || '');
      }
    } catch (error) {
      console.error('Failed to fetch idea:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamGeneration = async () => {
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}/team-generate`);
      if (response.ok) {
        const data = await response.json();
        setTeamGeneration(data.generation);
      }
    } catch (error) {
      console.error('Failed to fetch team generation:', error);
    }
  };

  const handleTeamGenerationComplete = (output: TeamGenerationOutput) => {
    // Refresh the idea to get updated team content
    fetchIdea();
    fetchTeamGeneration();
  };

  const handleStatusChange = async (newStatus: ContentIdeaStatus) => {
    if (!idea) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setIdea({ ...idea, ...updated });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!idea) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_title: editedTitle,
          idea_summary: editedSummary,
          why_interesting_to_creator: editedCreatorStory,
          why_interesting_to_audience: editedAudienceStory,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setIdea({ ...idea, ...updated });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save edits:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!idea) return;
    setRegenerating(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}?action=regenerate`, {
        method: 'POST',
      });
      if (response.ok) {
        const updated = await response.json();
        setIdea({ ...idea, ...updated });
        alert('Content regenerated successfully!');
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete this content idea?\n\n"${idea.idea_title || idea.source_url}"\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.location.href = '/admin/content-ideas';
      } else {
        const data = await response.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete content idea');
    }
  };

  const handleCreateBag = async () => {
    if (!idea) return;

    const productCount = idea.extracted_products?.length || 0;
    const confirmed = window.confirm(
      `Create a Teed bag from this content idea?\n\n` +
      `This will:\n` +
      `• Create a new bag with ${productCount} items\n` +
      `• Set bag title: "${idea.idea_title || idea.source_channel_name + "'s Setup"}"\n` +
      `• Include video source info in description\n` +
      `• Match any affiliate links to products\n` +
      `• Set hero item based on story potential`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content-ideas/${ideaId}?action=create-bag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const result = await response.json();
        alert(
          `Bag created successfully!\n\n` +
          `Code: ${result.bag.code}\n` +
          `Items: ${result.itemsCreated}\n` +
          `Links matched: ${result.linksCreated}`
        );
        fetchIdea();
      } else {
        const error = await response.json();
        alert(`Failed to create bag: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create bag:', error);
      alert('Failed to create bag. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const embedUrl = getYouTubeEmbedUrl(idea.source_url);
  const youtube = idea.source_metadata?.youtube;

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content-ideas"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Ideas
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-2xl font-bold text-gray-900 border-b-2 border-purple-500 focus:outline-none bg-transparent"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {idea.idea_title || youtube?.title || 'Untitled Idea'}
                </h1>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[idea.status]}`}>
                  {STATUS_DISPLAY_NAMES[idea.status]}
                </span>
                {idea.vertical && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {VERTICAL_DISPLAY_NAMES[idea.vertical] || idea.vertical}
                  </span>
                )}
                {idea.has_creator_affiliate && (
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Creator Affiliate
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdits}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg"
                  >
                    {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Regenerate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Embed */}
            {embedUrl && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <div className="p-3 border-t border-gray-200">
                  <a
                    href={idea.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open on YouTube
                  </a>
                </div>
              </div>
            )}

            {/* Video Stats */}
            {youtube?.statistics && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Video Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {parseInt(youtube.statistics.viewCount || '0').toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {parseInt(youtube.statistics.likeCount || '0').toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {parseInt(youtube.statistics.commentCount || '0').toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Comments</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Status Actions</h3>
              <div className="space-y-2">
                {idea.status === 'new' && (
                  <button
                    onClick={() => handleStatusChange('in_review')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                  >
                    <Clock className="w-4 h-4" />
                    Start Review
                  </button>
                )}
                {(idea.status === 'new' || idea.status === 'in_review') && (
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                )}
                {idea.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
                {idea.status !== 'archived' && (
                  <button
                    onClick={() => handleStatusChange('archived')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                >
                  <XCircle className="w-4 h-4" />
                  Delete Permanently
                </button>
              </div>
            </div>

            {/* Create Bag */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Teed Integration</h3>
              {idea.primary_bag_id ? (
                <div className="text-sm">
                  <p className="text-green-600 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Linked to Teed bag
                  </p>
                  {idea.primaryBag && (
                    <Link
                      href={`/u/${idea.primaryBag.owner.handle}/${idea.primaryBag.code}`}
                      className="inline-flex items-center gap-2 text-purple-600 hover:underline"
                    >
                      <Package className="w-4 h-4" />
                      View Bag: {idea.primaryBag.title}
                    </Link>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCreateBag}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <Package className="w-4 h-4" />
                  Create Teed Bag
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'products', label: 'Products', icon: ShoppingBag, count: idea.extracted_products?.length || 0 },
                    { id: 'hooks', label: 'Hooks', icon: MessageSquare },
                    { id: 'longform', label: 'Long-Form', icon: Video },
                    { id: 'shortform', label: 'Short-Form', icon: Scissors },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
                      {isEditing ? (
                        <textarea
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <p className="text-gray-700">{idea.idea_summary || 'No summary yet.'}</p>
                      )}
                    </div>

                    {/* Why Interesting to Creator */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Why It&apos;s Interesting to the Creator
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={editedCreatorStory}
                          onChange={(e) => setEditedCreatorStory(e.target.value)}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {idea.why_interesting_to_creator || 'Not generated yet.'}
                        </p>
                      )}
                    </div>

                    {/* Why Interesting to Audience */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Why It&apos;s Interesting to the Audience
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={editedAudienceStory}
                          onChange={(e) => setEditedAudienceStory(e.target.value)}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {idea.why_interesting_to_audience || 'Not generated yet.'}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {idea.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full"
                          >
                            {tag}
                          </span>
                        )) || <span className="text-gray-500">No tags</span>}
                      </div>
                    </div>

                    {/* Affiliate Notes */}
                    {idea.affiliate_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Affiliate Notes
                        </h4>
                        <p className="text-gray-700">{idea.affiliate_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (() => {
                  const products = idea.extracted_products || [];
                  const videoTitle = idea.source_metadata?.youtube?.title || idea.idea_title || '';
                  const contentType = detectVideoContentType(videoTitle, products.length);
                  const isSingleHero = contentType === 'single_hero';

                  // Sort by hero score
                  const sortedProducts = [...products].sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0));
                  const heroProduct = sortedProducts[0];

                  // Determine which products will be created as items
                  const productsToCreate = isSingleHero
                    ? [heroProduct, ...sortedProducts.filter(p => p !== heroProduct && (p.heroScore || 0) >= 40).slice(0, 2)]
                    : sortedProducts;

                  const alsoMentioned = isSingleHero
                    ? sortedProducts.filter(p => !productsToCreate.includes(p))
                    : [];

                  return (
                    <div className="space-y-4">
                      {/* Content Type Banner */}
                      <div className={`p-3 rounded-lg ${
                        isSingleHero
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Star className={`w-4 h-4 ${isSingleHero ? 'text-amber-600' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${isSingleHero ? 'text-amber-800' : 'text-blue-800'}`}>
                            {isSingleHero ? 'Single Product Focus' : contentType === 'comparison' ? 'Product Comparison' : 'Product Roundup'}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isSingleHero ? 'text-amber-700' : 'text-blue-700'}`}>
                          {isSingleHero
                            ? `This video focuses on one main item. Only the hero item and up to 2 supporting items will be added to the bag.`
                            : `This video covers multiple items equally. All ${products.length} products will be added to the bag.`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {isSingleHero ? 'Main Item' : 'All Items'}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {productsToCreate.length} item(s) will be created
                        </span>
                      </div>

                      {products.length > 0 ? (
                        <div className="space-y-3">
                          {productsToCreate.map((product, index) => {
                            const heroScore = product.heroScore || 0;
                            const isMainHero = product === heroProduct;

                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border ${
                                  isMainHero
                                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {product.name}
                                      </span>
                                      {isMainHero && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                                          <Star className="w-3 h-3" />
                                          {isSingleHero ? 'Main Focus' : 'Hero Item'}
                                        </span>
                                      )}
                                      {!isMainHero && isSingleHero && (
                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                          Supporting
                                        </span>
                                      )}
                                    </div>

                                    {product.brand && (
                                      <p className="text-sm text-gray-600 mt-0.5">{product.brand}</p>
                                    )}

                                    {product.category && (
                                      <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                                    )}

                                    {product.mentionContext && (
                                      <p className="text-sm text-gray-600 mt-2 italic">
                                        &ldquo;{product.mentionContext}&rdquo;
                                      </p>
                                    )}

                                    {product.storySignals && product.storySignals.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {product.storySignals.map((signal, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                                          >
                                            {signal}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-shrink-0 text-right">
                                    <div className={`text-lg font-bold ${
                                      heroScore >= 60
                                        ? 'text-amber-600'
                                        : heroScore >= 40
                                          ? 'text-purple-600'
                                          : 'text-gray-400'
                                    }`}>
                                      {heroScore}
                                    </div>
                                    <div className="text-xs text-gray-500">hero score</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No products extracted from this video.</p>
                      )}

                      {/* Also Mentioned (for single-hero) */}
                      {isSingleHero && alsoMentioned.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Also Mentioned ({alsoMentioned.length} items - not added to bag)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {alsoMentioned.map((product, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg"
                              >
                                {product.brand ? `${product.brand} ` : ''}{product.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Create Bag Summary */}
                      {products.length > 0 && (
                        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h5 className="text-sm font-medium text-purple-900 mb-2">Create Bag Summary</h5>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• <strong>{productsToCreate.length}</strong> item(s) will be created</li>
                            {isSingleHero && (
                              <li>• Main focus: <strong>{heroProduct?.brand ? `${heroProduct.brand} ` : ''}{heroProduct?.name}</strong></li>
                            )}
                            {alsoMentioned.length > 0 && (
                              <li>• {alsoMentioned.length} other items listed in bag description</li>
                            )}
                            {(idea.source_metadata?.extractedLinks?.length ?? 0) > 0 && (
                              <li>• {idea.source_metadata?.extractedLinks?.length} affiliate links to match</li>
                            )}
                          </ul>
                          <button
                            onClick={handleCreateBag}
                            disabled={saving || !!idea.primary_bag_id}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Package className="w-4 h-4" />
                            {idea.primary_bag_id
                              ? 'Bag Already Created'
                              : isSingleHero
                                ? `Create Bag for "${heroProduct?.name}"`
                                : `Create Bag with ${productsToCreate.length} Items`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Hooks Tab */}
                {activeTab === 'hooks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Short-Form Hooks</h4>
                      <span className="text-sm text-gray-500">{idea.hook_options?.length || 0} hooks</span>
                    </div>
                    {idea.hook_options && idea.hook_options.length > 0 ? (
                      <div className="space-y-3">
                        {(idea.hook_options as HookOption[]).map((hook, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium">&quot;{hook.hook}&quot;</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                    {hook.platform}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                    {hook.style}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(hook.hook)}
                                className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy hook"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No hooks generated yet.</p>
                    )}
                  </div>
                )}

                {/* Long-Form Tab */}
                {activeTab === 'longform' && (
                  <div className="space-y-6">
                    {idea.long_form_outline ? (
                      <>
                        {Object.entries(idea.long_form_outline as LongFormOutline).map(([key, value]) => {
                          if (key === 'estimatedDurationMinutes' || !value) return null;
                          const labels: Record<string, string> = {
                            // Standard long-form sections
                            intro: 'Introduction & Hook',
                            creatorStory: "Creator's Story",
                            heroBreakdown: 'Hero Item Breakdown',
                            comparison: 'Comparison',
                            demonstration: 'Demonstration',
                            bagContext: 'Teed Bag Context',
                            cta: 'Call to Action',
                            // Roundup-specific sections
                            curatorCredentials: "Curator's Credentials",
                            topPicks: 'Top Picks',
                            hiddenGems: 'Hidden Gems',
                            budgetPicks: 'Budget Picks',
                          };
                          return (
                            <div key={key}>
                              <h4 className="text-sm font-medium text-purple-600 mb-2">{labels[key] || key}</h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
                            </div>
                          );
                        })}
                        {(idea.long_form_outline as LongFormOutline).estimatedDurationMinutes && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                              Estimated Duration:{' '}
                              <span className="font-medium text-gray-700">
                                {(idea.long_form_outline as LongFormOutline).estimatedDurationMinutes} minutes
                              </span>
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No long-form outline generated yet.</p>
                    )}
                  </div>
                )}

                {/* Short-Form Tab */}
                {activeTab === 'shortform' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Short-Form Ideas</h4>
                      <span className="text-sm text-gray-500">{idea.short_form_ideas?.length || 0} clips</span>
                    </div>
                    {idea.short_form_ideas && idea.short_form_ideas.length > 0 ? (
                      <div className="space-y-4">
                        {(idea.short_form_ideas as ShortFormIdea[]).map((clip, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">&quot;{clip.hook}&quot;</p>
                                <p className="text-sm text-gray-600 mt-2">{clip.narrative}</p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="text-xs text-gray-500">{clip.durationSeconds}s</span>
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                                    {clip.beatType}
                                  </span>
                                  {clip.platform && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                      {clip.platform}
                                    </span>
                                  )}
                                </div>
                                {clip.onScreenText && clip.onScreenText.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">On-Screen Text:</p>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                      {clip.onScreenText.map((text, i) => (
                                        <li key={i}>• {text}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No short-form ideas generated yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Content Team Panel - Only show for 'generated' status */}
            {idea.status === 'generated' && (
              <TeamGenerationPanel
                contentIdeaId={ideaId}
                hasBag={!!idea.primary_bag_id}
                existingGeneration={teamGeneration}
                onGenerationComplete={handleTeamGenerationComplete}
              />
            )}

            {/* Source Info */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Source Information</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Channel</dt>
                  <dd className="text-gray-900 font-medium">{idea.source_channel_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Platform</dt>
                  <dd className="text-gray-900 font-medium capitalize">{idea.source_platform}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Published</dt>
                  <dd className="text-gray-900">
                    {idea.source_published_at
                      ? new Date(idea.source_published_at).toLocaleDateString()
                      : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Imported</dt>
                  <dd className="text-gray-900">{new Date(idea.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
