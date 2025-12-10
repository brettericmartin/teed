'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Loader2,
  Check,
  X,
  Calendar,
  TrendingUp,
  Star,
  User,
  Package,
  Clock,
} from 'lucide-react';
import type { AdminRole } from '@/lib/types/admin';
import type {
  SearchQuery,
  ContentVertical,
  SearchQueryType,
  TrendSuggestion,
} from '@/lib/types/contentIdeas';
import {
  VERTICAL_DISPLAY_NAMES,
  QUERY_TYPE_DISPLAY_NAMES,
  QUERY_TYPE_COLORS,
} from '@/lib/types/contentIdeas';

interface Props {
  adminRole: AdminRole;
  adminId: string;
}

export default function SearchQueriesClient({ adminRole }: Props) {
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [verticalFilter, setVerticalFilter] = useState<ContentVertical | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SearchQueryType | 'all'>('all');

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SearchQuery | null>(null);
  const [formData, setFormData] = useState({
    query: '',
    vertical: 'golf' as ContentVertical,
    query_type: 'evergreen' as SearchQueryType,
    priority: 50,
    is_active: true,
    notes: '',
    expires_at: '',
  });

  // AI Suggestions
  const [suggestions, setSuggestions] = useState<TrendSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (verticalFilter !== 'all') params.set('vertical', verticalFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const url = `/api/admin/content-ideas/queries${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries || []);
      }
    } catch (error) {
      console.error('Failed to fetch queries:', error);
    } finally {
      setLoading(false);
    }
  }, [verticalFilter, typeFilter]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const handleSave = async () => {
    setActionLoading('save');
    try {
      const url = editingQuery
        ? `/api/admin/content-ideas/queries/${editingQuery.id}`
        : '/api/admin/content-ideas/queries';

      const response = await fetch(url, {
        method: editingQuery ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: formData.query,
          vertical: formData.vertical,
          query_type: formData.query_type,
          priority: formData.priority,
          is_active: formData.is_active,
          notes: formData.notes || null,
          expires_at: formData.expires_at || null,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingQuery(null);
        resetForm();
        fetchQueries();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save query');
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this search query?')) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/content-ideas/queries/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchQueries();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (query: SearchQuery) => {
    setActionLoading(query.id);
    try {
      await fetch(`/api/admin/content-ideas/queries/${query.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !query.is_active }),
      });
      fetchQueries();
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSuggestions = async () => {
    setActionLoading('suggest');
    try {
      const response = await fetch('/api/admin/content-ideas/queries/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verticals: verticalFilter !== 'all' ? [verticalFilter] : ['golf', 'camera', 'desk', 'tech'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Suggestion failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSuggestion = async (suggestion: TrendSuggestion) => {
    setActionLoading(`add-${suggestion.query}`);
    try {
      const response = await fetch('/api/admin/content-ideas/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: suggestion.query,
          vertical: suggestion.vertical,
          query_type: suggestion.query_type,
          priority: suggestion.priority,
          expires_at: suggestion.expires_at,
          notes: suggestion.reason,
          source: 'ai_suggested',
        }),
      });

      if (response.ok) {
        setSuggestions(prev => prev.filter(s => s.query !== suggestion.query));
        fetchQueries();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      query: '',
      vertical: 'golf',
      query_type: 'evergreen',
      priority: 50,
      is_active: true,
      notes: '',
      expires_at: '',
    });
  };

  const openEditModal = (query: SearchQuery) => {
    setEditingQuery(query);
    setFormData({
      query: query.query,
      vertical: query.vertical,
      query_type: query.query_type,
      priority: query.priority,
      is_active: query.is_active,
      notes: query.notes || '',
      expires_at: query.expires_at?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const getQueryTypeIcon = (type: SearchQueryType) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-3 h-3" />;
      case 'product_launch':
        return <Package className="w-3 h-3" />;
      case 'creator':
        return <User className="w-3 h-3" />;
      case 'trending':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  // Group queries by vertical
  const groupedQueries = queries.reduce(
    (acc, query) => {
      if (!acc[query.vertical]) acc[query.vertical] = [];
      acc[query.vertical].push(query);
      return acc;
    },
    {} as Record<ContentVertical, SearchQuery[]>
  );

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Search className="w-7 h-7 text-blue-600" />
                Search Queries
              </h1>
              <p className="text-gray-600 mt-1">
                Manage YouTube search queries for content discovery
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSuggestions}
                disabled={actionLoading === 'suggest'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === 'suggest' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Suggestions
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingQuery(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Query
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={verticalFilter}
              onChange={e => setVerticalFilter(e.target.value as ContentVertical | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Verticals</option>
              {Object.entries(VERTICAL_DISPLAY_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as SearchQueryType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(QUERY_TYPE_DISPLAY_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            <span className="text-sm text-gray-500 ml-auto">
              {queries.length} queries ({queries.filter(q => q.is_active).length} active)
            </span>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Suggested Queries
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{suggestion.query}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${QUERY_TYPE_COLORS[suggestion.query_type]}`}
                      >
                        {QUERY_TYPE_DISPLAY_NAMES[suggestion.query_type]}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {VERTICAL_DISPLAY_NAMES[suggestion.vertical]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                  </div>
                  <button
                    onClick={() => handleAddSuggestion(suggestion)}
                    disabled={actionLoading === `add-${suggestion.query}`}
                    className="ml-4 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading === `add-${suggestion.query}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queries List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No search queries found</p>
            <p className="text-sm text-gray-500 mt-1">
              Add queries or use AI suggestions to get started
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedQueries).map(([vertical, verticalQueries]) => (
              <div key={vertical} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-medium text-gray-900">
                    {VERTICAL_DISPLAY_NAMES[vertical as ContentVertical] || vertical}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({verticalQueries.length} queries)
                    </span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {verticalQueries.map(query => (
                    <div
                      key={query.id}
                      className={`px-4 py-3 flex items-center gap-4 ${
                        !query.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{query.query}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                              QUERY_TYPE_COLORS[query.query_type]
                            }`}
                          >
                            {getQueryTypeIcon(query.query_type)}
                            {QUERY_TYPE_DISPLAY_NAMES[query.query_type]}
                          </span>
                          {query.expires_at && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              <Clock className="w-3 h-3" />
                              Expires {new Date(query.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {query.notes && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{query.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Priority: {query.priority}</span>
                        {query.videos_found > 0 && (
                          <span className="text-green-600">{query.videos_found} found</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(query)}
                          disabled={actionLoading === query.id}
                          className={`p-2 rounded ${
                            query.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={query.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(query)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(query.id)}
                          disabled={actionLoading === query.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingQuery ? 'Edit Query' : 'Add Search Query'}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query *
                </label>
                <input
                  type="text"
                  value={formData.query}
                  onChange={e => setFormData(prev => ({ ...prev, query: e.target.value }))}
                  placeholder="e.g., masters 2025 golfer bag"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vertical *</label>
                  <select
                    value={formData.vertical}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, vertical: e.target.value as ContentVertical }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(VERTICAL_DISPLAY_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.query_type}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        query_type: e.target.value as SearchQueryType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(QUERY_TYPE_DISPLAY_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Why this query is relevant..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (include in discovery scans)
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingQuery(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.query || actionLoading === 'save'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === 'save' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingQuery ? (
                  'Save Changes'
                ) : (
                  'Add Query'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
