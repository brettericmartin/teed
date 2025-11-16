'use client';

import { useState } from 'react';
import { Share2, ExternalLink } from 'lucide-react';

interface Link {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
}

interface Item {
  id: string;
  custom_name: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  links: Link[];
}

interface Bag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

interface PublicBagViewProps {
  bag: Bag;
  items: Item[];
  ownerHandle: string;
  ownerName: string;
}

export default function PublicBagView({
  bag,
  items,
  ownerHandle,
  ownerName,
}: PublicBagViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bag.title,
          text: bag.description || `Check out ${ownerName}'s ${bag.title} on Teed`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const getLinkTypeColor = (kind: string) => {
    const colors: Record<string, string> = {
      product: 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      video: 'bg-red-100 text-red-700',
      article: 'bg-green-100 text-green-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[kind] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{bag.title}</h1>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              {bag.description && (
                <p className="text-gray-600 text-lg">{bag.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                by <span className="font-medium">@{ownerHandle}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No items in this bag yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {item.custom_name}
                  </h3>
                  {item.quantity > 1 && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      ×{item.quantity}
                    </span>
                  )}
                </div>

                {item.custom_description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.custom_description}
                  </p>
                )}

                {item.links.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {item.links.length} {item.links.length === 1 ? 'link' : 'links'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedItem.custom_name}
                  </h2>
                  {selectedItem.quantity > 1 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                      ×{selectedItem.quantity}
                    </span>
                  )}
                </div>
                {selectedItem.custom_description && (
                  <p className="mt-2 text-gray-600">{selectedItem.custom_description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Notes */}
              {selectedItem.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              {/* Links */}
              {selectedItem.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Links</h3>
                  <div className="space-y-2">
                    {selectedItem.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getLinkTypeColor(
                                  link.kind
                                )}`}
                              >
                                {link.kind.charAt(0).toUpperCase() + link.kind.slice(1)}
                              </span>
                            </div>
                            <p className="text-blue-600 group-hover:text-blue-800 font-medium break-all">
                              {link.label || new URL(link.url).hostname}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 break-all">
                              {link.url}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-2 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!selectedItem.notes && selectedItem.links.length === 0 && (
                <p className="text-gray-500 text-center py-8">No additional details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Created with</p>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Teed
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Organize and share your gear collections
          </p>
        </div>
      </div>
    </div>
  );
}
