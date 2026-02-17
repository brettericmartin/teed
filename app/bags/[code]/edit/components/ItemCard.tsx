'use client';

import { useState } from 'react';
import { ChevronDown, Edit2, Trash2, X, Check, Link as LinkIcon, Copy, CheckCheck, Sparkles, MessageSquareQuote } from 'lucide-react';
import LinkManagerModal from './LinkManagerModal';
import ItemPhotoUpload from './ItemPhotoUpload';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
};

type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  why_chosen: string | null;
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
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editDescription, setEditDescription] = useState(item.custom_description || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [editPromoCodes, setEditPromoCodes] = useState(item.promo_codes || '');
  const [editWhyChosen, setEditWhyChosen] = useState(item.why_chosen || '');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [itemLinks, setItemLinks] = useState(item.links);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGeneratingWhy, setIsGeneratingWhy] = useState(false);

  const handleSaveEdit = () => {
    onUpdate(item.id, {
      custom_name: editName.trim() || item.custom_name,
      brand: editBrand.trim() || null,
      custom_description: editDescription.trim() || null,
      notes: editNotes.trim() || null,
      why_chosen: editWhyChosen.trim() || null,
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
    setEditWhyChosen(item.why_chosen || '');
    setEditQuantity(item.quantity.toString());
    setEditPromoCodes(item.promo_codes || '');
    setIsEditing(false);
  };

  const handleGenerateWhyChosen = async () => {
    setIsGeneratingWhy(true);
    try {
      const res = await fetch('/api/ai/generate-why-chosen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.whyChosen) {
          setEditWhyChosen(data.whyChosen);
          // If not in edit mode, save directly
          if (!isEditing) {
            onUpdate(item.id, { why_chosen: data.whyChosen } as any);
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate why chosen:', err);
    } finally {
      setIsGeneratingWhy(false);
    }
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
                className="w-20 h-20 object-contain bg-[var(--sky-2)] rounded border-2 border-[var(--border-subtle)]"
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
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span>Qty: {item.quantity}</span>
                  {itemLinks.length > 0 && (
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="flex items-center hover:text-[var(--teed-green-9)] transition-colors"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
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
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
                  title="Save"
                >
                  <Check className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--copper-9)] transition-colors"
                  title="Delete"
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
              existingMediaAssetId={item.custom_photo_id}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoRemoved={handlePhotoRemoved}
              itemName={item.custom_name || 'Item'}
              itemBrand={item.brand}
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

          {/* Why I Chose This */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-[var(--teed-green-9)]" />
                Why I Chose This
              </h4>
              {!item.why_chosen && (
                <button
                  onClick={handleGenerateWhyChosen}
                  disabled={isGeneratingWhy}
                  className="flex items-center gap-1.5 text-xs text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingWhy ? 'animate-spin' : ''}`} />
                  {isGeneratingWhy ? 'Generating...' : 'AI Draft'}
                </button>
              )}
            </div>
            {item.why_chosen ? (
              <div className="bg-[var(--teed-green-1)] border border-[var(--teed-green-6)] rounded-lg p-3">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{item.why_chosen}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] italic">
                Tell people why you picked this — it helps others decide too.
              </p>
            )}
          </div>

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
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Links</h4>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="text-xs text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)]"
              >
                {itemLinks.length > 0 ? 'Manage Links' : '+ Add Link'}
              </button>
            </div>
            {itemLinks.length > 0 ? (
              <div className="space-y-2">
                {itemLinks.slice(0, 3).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-[var(--surface)] rounded border border-[var(--border-subtle)]"
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:underline truncate block"
                      >
                        {link.url}
                      </a>
                      <span className="text-xs text-[var(--text-secondary)] capitalize">{link.kind}</span>
                    </div>
                  </div>
                ))}
                {itemLinks.length > 3 && (
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--teed-green-9)]"
                  >
                    + {itemLinks.length - 3} more
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] italic">No links yet</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Notes & Why Chosen */}
      {isEditing && (
        <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--sky-1)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add notes about this item"
              rows={3}
              className="w-full px-2 py-1 text-sm border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-[var(--teed-green-9)]" />
                Why I Chose This
              </label>
              <button
                onClick={handleGenerateWhyChosen}
                disabled={isGeneratingWhy}
                className="flex items-center gap-1.5 text-xs text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingWhy ? 'animate-spin' : ''}`} />
                {isGeneratingWhy ? 'Generating...' : 'AI Draft'}
              </button>
            </div>
            <textarea
              value={editWhyChosen}
              onChange={(e) => setEditWhyChosen(e.target.value)}
              placeholder="Why did you pick this over alternatives? What makes it special?"
              rows={3}
              className="w-full px-2 py-1 text-sm border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
            />
          </div>
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
