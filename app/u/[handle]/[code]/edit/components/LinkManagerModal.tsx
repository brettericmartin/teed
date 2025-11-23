'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Link {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
}

interface LinkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  links: Link[];
  onLinksChange: (links: Link[]) => void;
}

export default function LinkManagerModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  links,
  onLinksChange,
}: LinkManagerModalProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newKind, setNewKind] = useState('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editKind, setEditKind] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the URL input when modal opens
  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddLink = async () => {
    setError('');

    if (!newUrl.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(newUrl)) {
      setError('Please enter a valid URL (include https://)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/items/${itemId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          kind: newKind,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const newLink = await response.json();
      onLinksChange([...links, newLink]);
      setNewUrl('');
      setNewKind('product');
      // Re-focus the input after adding
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 0);
    } catch (err: any) {
      setError(err.message || 'Failed to add link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLink = async (linkId: string) => {
    setError('');

    if (!editUrl.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(editUrl)) {
      setError('Please enter a valid URL (include https://)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editUrl,
          kind: editKind,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update link');
      }

      const updatedLink = await response.json();
      onLinksChange(links.map(link => link.id === linkId ? updatedLink : link));
      setEditingLinkId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    // Optimistic update
    const originalLinks = [...links];
    onLinksChange(links.filter(link => link.id !== linkId));

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }
    } catch (err: any) {
      // Revert on error
      onLinksChange(originalLinks);
      setError(err.message || 'Failed to delete link');
    }
  };

  const startEditing = (link: Link) => {
    setEditingLinkId(link.id);
    setEditUrl(link.url);
    setEditKind(link.kind);
    setError('');
  };

  const cancelEditing = () => {
    setEditingLinkId(null);
    setEditUrl('');
    setEditKind('');
    setError('');
  };

  const getLinkDisplay = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  const linkKindOptions = [
    { value: 'product', label: 'Product' },
    { value: 'review', label: 'Review' },
    { value: 'video', label: 'Video' },
    { value: 'article', label: 'Article' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Links</h2>
            <p className="text-sm text-gray-600 mt-1">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Existing Links */}
          <div className="space-y-3 mb-6">
            {links.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No links added yet</p>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {editingLinkId === link.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://example.com/product"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={editKind}
                          onChange={(e) => setEditKind(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent"
                        >
                          {linkKindOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditLink(link.id)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-[var(--button-create-bg)] text-white rounded-lg hover:bg-[var(--button-create-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--teed-green-2)] text-[var(--teed-green-11)]">
                            {linkKindOptions.find(opt => opt.value === link.kind)?.label || link.kind}
                          </span>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-11)] text-sm font-medium break-all"
                        >
                          {getLinkDisplay(link.url)}
                        </a>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEditing(link)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-sm text-[var(--copper-9)] hover:text-[var(--copper-11)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Link Form - Always visible */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Add New Link</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                ref={urlInputRef}
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newUrl.trim()) {
                    handleAddLink();
                  }
                }}
                placeholder="https://example.com/product"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent"
              >
                {linkKindOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddLink}
              disabled={isSubmitting || !newUrl.trim()}
              className="w-full px-4 py-2 bg-[var(--button-create-bg)] text-white rounded-lg hover:bg-[var(--button-create-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
