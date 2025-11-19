'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Edit2, Trash2, X, Check, Link as LinkIcon, Copy, CheckCheck, Star } from 'lucide-react';
import LinkManagerModal from './LinkManagerModal';
import ItemPhotoUpload from './ItemPhotoUpload';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
  is_auto_generated?: boolean;
};

type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  custom_photo_id: string | null;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  featured_position: number | null;
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
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editDescription, setEditDescription] = useState(item.custom_description || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [editPromoCodes, setEditPromoCodes] = useState(item.promo_codes || '');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [itemLinks, setItemLinks] = useState(item.links);
  const [copySuccess, setCopySuccess] = useState(false);

  // Update itemLinks when item.links changes (e.g., after Fill Links is clicked)
  useEffect(() => {
    setItemLinks(item.links);
  }, [item.links]);

  const handleSaveEdit = () => {
    onUpdate(item.id, {
      custom_name: editName.trim() || item.custom_name,
      brand: editBrand.trim() || null,
      custom_description: editDescription.trim() || null,
      notes: editNotes.trim() || null,
      quantity: parseInt(editQuantity) || 1,
      promo_codes: editPromoCodes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.custom_name || '');
    setEditBrand(item.brand || '');
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
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] transition-all">
      {/* Item Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo thumbnail (left side) */}
          {item.photo_url && !isEditing && (
            <div className="flex-shrink-0">
              <img
                src={item.photo_url}
                alt={item.custom_name || 'Item photo'}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-[var(--sky-2)] rounded border-2 border-[var(--border-subtle)]"
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
                  className="w-full text-lg font-semibold px-2 py-1 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                  autoFocus
                />
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="Brand (e.g., TaylorMade, MAC, Patagonia)"
                  className="w-full text-sm px-2 py-1 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full text-sm px-2 py-1 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[var(--text-primary)]">Qty:</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min="1"
                    className="w-20 text-sm px-2 py-1 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={editPromoCodes}
                  onChange={(e) => setEditPromoCodes(e.target.value)}
                  placeholder="Promo codes (e.g., SAVE20, WELCOME10)"
                  className="w-full text-sm px-2 py-1 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                  {item.custom_name}
                </h3>
                {item.brand && (
                  <p className="mt-1 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    {item.brand}
                  </p>
                )}
                {item.custom_description && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                    {item.custom_description}
                  </p>
                )}
                {itemLinks.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <a
                      href={itemLinks[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:underline truncate max-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {itemLinks[0].url}
                    </a>
                    {itemLinks.length > 1 && (
                      <span className="text-[var(--text-tertiary)] whitespace-nowrap">
                        +{itemLinks.length - 1} more
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                  title="Cancel"
                  aria-label="Cancel editing"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:bg-[var(--teed-green-2)] rounded-lg transition-colors"
                  title="Save"
                  aria-label="Save changes"
                >
                  <Check className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onUpdate(item.id, { is_featured: !item.is_featured });
                  }}
                  className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all ${
                    item.is_featured
                      ? 'text-[var(--amber-9)] bg-[var(--amber-3)] hover:bg-[var(--amber-4)] hover:text-[var(--amber-10)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--amber-9)] hover:bg-[var(--amber-2)]'
                  }`}
                  title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                  aria-label={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                >
                  <Star className={`w-5 h-5 transition-all ${item.is_featured ? 'fill-current scale-110' : ''}`} />
                </button>
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors relative ${
                    itemLinks.length > 0
                      ? 'text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:bg-[var(--teed-green-2)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--teed-green-9)] hover:bg-[var(--teed-green-2)]'
                  }`}
                  title={itemLinks.length > 0 ? `Manage links (${itemLinks.length})` : 'Add links'}
                  aria-label={itemLinks.length > 0 ? `Manage ${itemLinks.length} links` : 'Add links'}
                >
                  <LinkIcon className="w-5 h-5" />
                  {itemLinks.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--teed-green-9)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {itemLinks.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                  title="Edit"
                  aria-label="Edit item"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--copper-9)] hover:bg-[var(--copper-2)] rounded-lg transition-colors"
                  title="Delete"
                  aria-label="Delete item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && !isEditing && (
        <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--sky-1)] space-y-4">
          {/* Photo Upload/Display */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Photo</h4>
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
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">Notes</h4>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Promo Codes */}
          {item.promo_codes && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Promo Codes</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[var(--sand-2)] rounded text-sm font-mono text-[var(--text-primary)] border border-[var(--border-subtle)]">
                  {item.promo_codes}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.promo_codes!);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] rounded hover:bg-[var(--button-secondary-bg-hover)] text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {copySuccess ? (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Links */}
          {itemLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Links</h4>
              <div className="space-y-2">
                {itemLinks.slice(0, 3).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-[var(--surface)] rounded border border-[var(--border-subtle)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:underline truncate block flex-1"
                        >
                          {link.url}
                        </a>
                        {link.is_auto_generated && (
                          <span
                            className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-[var(--teed-green-3)] text-[var(--teed-green-11)] rounded font-medium"
                            title="Auto-generated by Teed"
                          >
                            TEED
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] capitalize">{link.kind}</span>
                    </div>
                  </div>
                ))}
                {itemLinks.length > 3 && (
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="text-xs px-2 py-1.5 min-h-[36px] rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] transition-colors"
                  >
                    + {itemLinks.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Notes */}
      {isEditing && (
        <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--sky-1)]">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes about this item"
            rows={3}
            className="w-full px-2 py-1 text-sm border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
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
