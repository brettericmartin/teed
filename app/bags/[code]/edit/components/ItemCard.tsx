'use client';

import { useState } from 'react';
import LinkManagerModal from './LinkManagerModal';
import ItemPhotoUpload from './ItemPhotoUpload';

type Link = {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
};

type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  custom_photo_id: string | null;
  photo_url: string | null;
  promo_codes: string | null;
  links: Link[];
};

type ItemCardProps = {
  item: Item;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>) => void;
  bagCode: string;
};

export default function ItemCard({ item, onDelete, onUpdate, bagCode }: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.custom_name || '');
  const [editDescription, setEditDescription] = useState(item.custom_description || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [editPromoCodes, setEditPromoCodes] = useState(item.promo_codes || '');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [itemLinks, setItemLinks] = useState(item.links);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSaveEdit = () => {
    onUpdate(item.id, {
      custom_name: editName.trim() || item.custom_name,
      custom_description: editDescription.trim() || null,
      notes: editNotes.trim() || null,
      quantity: parseInt(editQuantity) || 1,
      promo_codes: editPromoCodes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.custom_name || '');
    setEditDescription(item.custom_description || '');
    setEditNotes(item.notes || '');
    setEditQuantity(item.quantity.toString());
    setEditPromoCodes(item.promo_codes || '');
    setIsEditing(false);
  };

  const handlePhotoUploaded = async (mediaAssetId: string, photoUrl: string) => {
    // Update item with new photo
    await onUpdate(item.id, {
      custom_photo_id: mediaAssetId,
      photo_url: photoUrl, // Pass photo_url to preserve in local state
    } as any);
  };

  const handlePhotoRemoved = async () => {
    // Remove photo from item
    await onUpdate(item.id, {
      custom_photo_id: null,
      photo_url: null, // Clear photo_url in local state
    } as any);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Item Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo thumbnail (left side) */}
          {item.photo_url && !isEditing && (
            <div className="flex-shrink-0">
              <img
                src={item.photo_url}
                alt={item.custom_name || 'Item photo'}
                className="w-20 h-20 object-contain bg-gray-50 rounded border-2 border-gray-200"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-lg font-semibold px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Qty:</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min="1"
                    className="w-20 text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={editPromoCodes}
                  onChange={(e) => setEditPromoCodes(e.target.value)}
                  placeholder="Promo codes (e.g., SAVE20, WELCOME10)"
                  className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {item.custom_name}
                </h3>
                {item.custom_description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {item.custom_description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span>Qty: {item.quantity}</span>
                  {itemLinks.length > 0 && (
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="flex items-center hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {itemLinks.length} {itemLinks.length === 1 ? 'link' : 'links'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cancel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Save"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && !isEditing && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
          {/* Photo Upload/Display */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Photo</h4>
            <ItemPhotoUpload
              itemId={item.id}
              currentPhotoUrl={item.photo_url}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoRemoved={handlePhotoRemoved}
              itemName={item.custom_name || 'Item'}
              itemDescription={item.custom_description}
            />
          </div>

          {/* Notes */}
          {item.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Promo Codes */}
          {item.promo_codes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Promo Codes</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-900">
                  {item.promo_codes}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.promo_codes!);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Links</h4>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {itemLinks.length > 0 ? 'Manage Links' : '+ Add Link'}
              </button>
            </div>
            {itemLinks.length > 0 ? (
              <div className="space-y-2">
                {itemLinks.slice(0, 3).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate block"
                      >
                        {link.label || link.url}
                      </a>
                      <span className="text-xs text-gray-500 capitalize">{link.kind}</span>
                    </div>
                  </div>
                ))}
                {itemLinks.length > 3 && (
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="text-xs text-gray-600 hover:text-blue-600"
                  >
                    + {itemLinks.length - 3} more
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No links yet</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Notes */}
      {isEditing && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes about this item"
            rows={3}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      )}

      {/* Link Manager Modal */}
      <LinkManagerModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        itemId={item.id}
        itemName={item.custom_name || 'Item'}
        links={itemLinks}
        onLinksChange={setItemLinks}
      />
    </div>
  );
}
