'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Edit2, Trash2, X, Check, Link as LinkIcon, Copy, CheckCheck, Star, Trophy, Sparkles, Loader2, FolderInput } from 'lucide-react';
import LinkManagerModal from './LinkManagerModal';
import MoveToBagModal from './MoveToBagModal';
import ItemPhotoUpload from './ItemPhotoUpload';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
  is_auto_generated?: boolean;
};

type ItemSpecs = {
  [key: string]: string | number | boolean;
};

type Section = {
  id: string;
  name: string;
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
  section_id: string | null;
  // Context fields (Phase 1)
  why_chosen: string | null;
  specs: ItemSpecs;
  compared_to: string | null;
  alternatives: string[] | null;
  price_paid: number | null;
  purchase_date: string | null;
  links: Link[];
  // Optimistic UI state
  _isPending?: boolean;
  _optimisticId?: string;
};

type ItemCardProps = {
  item: Item;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>) => void;
  bagCode: string;
  isHero?: boolean;
  onToggleHero?: (itemId: string) => void;
  onItemMoved?: (itemId: string, targetBagTitle: string) => void;
};

export default function ItemCard({ item, onDelete, onUpdate, bagCode, isHero = false, onToggleHero, onItemMoved }: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editName, setEditName] = useState(item.custom_name || '');
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editDescription, setEditDescription] = useState(item.custom_description || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [editPromoCodes, setEditPromoCodes] = useState(item.promo_codes || '');
  // New context field states
  const [editWhyChosen, setEditWhyChosen] = useState(item.why_chosen || '');
  const [editComparedTo, setEditComparedTo] = useState(item.compared_to || '');
  const [editPricePaid, setEditPricePaid] = useState(item.price_paid?.toString() || '');
  const [editPurchaseDate, setEditPurchaseDate] = useState(item.purchase_date || '');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [itemLinks, setItemLinks] = useState(item.links);
  const [isGeneratingWhyChosen, setIsGeneratingWhyChosen] = useState(false);

  const handleGenerateWhyChosen = async () => {
    setIsGeneratingWhyChosen(true);
    try {
      const response = await fetch('/api/ai/generate-why-chosen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          tone: 'casual',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const data = await response.json();
      if (data.whyChosen) {
        setEditWhyChosen(data.whyChosen);
      }
    } catch (error) {
      console.error('Error generating why chosen:', error);
    } finally {
      setIsGeneratingWhyChosen(false);
    }
  };
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
      // New context fields
      why_chosen: editWhyChosen.trim() || null,
      compared_to: editComparedTo.trim() || null,
      price_paid: editPricePaid ? parseFloat(editPricePaid) : null,
      purchase_date: editPurchaseDate || null,
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
    // Reset new context fields
    setEditWhyChosen(item.why_chosen || '');
    setEditComparedTo(item.compared_to || '');
    setEditPricePaid(item.price_paid?.toString() || '');
    setEditPurchaseDate(item.purchase_date || '');
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

  const isPending = item._isPending;

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] transition-all ${isPending ? 'relative' : ''}`}>
      {/* Pending overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white/60 rounded-[var(--radius-xl)] flex items-center justify-center z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Adding...</span>
          </div>
        </div>
      )}
      {/* Item Header */}
      <div className="p-3 sm:p-4">
        {/* Photo thumbnail - full width on mobile, left side on desktop */}
        {item.photo_url && !isEditing && (
          <div className="mb-3 sm:mb-0 sm:float-left sm:mr-4">
            <img
              src={item.photo_url}
              alt={item.custom_name || 'Item photo'}
              className="w-full sm:w-20 h-auto sm:h-20 max-h-48 sm:max-h-20 object-contain bg-[var(--sky-2)] rounded border-2 border-[var(--border-subtle)]"
            />
          </div>
        )}

        <div className="flex items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                  autoFocus
                />
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="Brand (e.g., TaylorMade, MAC, Patagonia)"
                  className="w-full text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (e.g., specs, color, features)"
                  rows={2}
                  className="w-full text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
                />
                <div className="flex items-center gap-2">
                  <label className="text-base text-[var(--text-primary)]">Qty:</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min="1"
                    className="w-20 text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={editPromoCodes}
                  onChange={(e) => setEditPromoCodes(e.target.value)}
                  placeholder="Promo codes (e.g., SAVE20, WELCOME10)"
                  className="w-full text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Private notes (e.g., where you bought it, why you love it)"
                    rows={2}
                    className="w-full px-3 py-2 text-base border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
                  />
                </div>

                {/* Context Fields Section */}
                <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
                  <h4 className="text-sm font-medium text-[var(--teed-green-11)] mb-3 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-[var(--teed-green-9)] rounded-full"></span>
                    Rich Context (helps readers understand your choice)
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-[var(--text-primary)]">
                          Why I chose this
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateWhyChosen}
                          disabled={isGeneratingWhyChosen}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--sky-11)] bg-[var(--sky-3)] hover:bg-[var(--sky-4)] rounded-md transition-colors disabled:opacity-50"
                        >
                          {isGeneratingWhyChosen ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {isGeneratingWhyChosen ? 'Generating...' : 'AI Generate'}
                        </button>
                      </div>
                      <textarea
                        value={editWhyChosen}
                        onChange={(e) => setEditWhyChosen(e.target.value)}
                        placeholder="Share your story: What made you pick this? What problem does it solve? (e.g., 'This driver replaced my Callaway because the adjustable weights let me fix my slice')"
                        rows={3}
                        className="w-full px-3 py-2 text-base border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none placeholder:text-[var(--input-placeholder)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                        Compared to / Replaced
                      </label>
                      <input
                        type="text"
                        value={editComparedTo}
                        onChange={(e) => setEditComparedTo(e.target.value)}
                        placeholder="What did this replace or what did you compare it to? (e.g., 'Upgraded from Sony A7III')"
                        className="w-full text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                          Price Paid
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPricePaid}
                            onChange={(e) => setEditPricePaid(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-base pl-7 pr-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent placeholder:text-[var(--input-placeholder)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={editPurchaseDate}
                          onChange={(e) => setEditPurchaseDate(e.target.value)}
                          className="w-full text-base px-3 py-2 border border-[var(--input-border)] rounded bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight">
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
                {item.notes && (
                  <p className="mt-1 text-sm text-[var(--text-tertiary)] italic line-clamp-1">
                    💭 {item.notes}
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
          <div className="flex items-center gap-1 flex-shrink-0">
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
                {/* Show Trophy, Star and Link only on desktop or when expanded */}
                {onToggleHero && (
                  <button
                    onClick={() => onToggleHero(item.id)}
                    className={`hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-all ${
                      isHero
                        ? 'text-[var(--amber-9)] bg-[var(--amber-3)] hover:bg-[var(--amber-4)] hover:text-[var(--amber-10)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--amber-9)] hover:bg-[var(--amber-2)]'
                    }`}
                    title={isHero ? 'Remove hero status' : 'Set as hero piece'}
                    aria-label={isHero ? 'Remove hero status' : 'Set as hero piece'}
                  >
                    <Trophy className={`w-5 h-5 transition-all ${isHero ? 'fill-current scale-110' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => {
                    onUpdate(item.id, { is_featured: !item.is_featured });
                  }}
                  className={`hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-all ${
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
                  className={`hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors relative ${
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
                {onItemMoved && (
                  <button
                    onClick={() => setIsMoveModalOpen(true)}
                    className="hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-[var(--sky-9)] hover:bg-[var(--sky-2)]"
                    title="Move to another curation"
                    aria-label="Move to another curation"
                  >
                    <FolderInput className="w-5 h-5" />
                  </button>
                )}
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
                  className="hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--copper-9)] hover:bg-[var(--copper-2)] rounded-lg transition-colors"
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
          {/* Mobile-only action buttons */}
          <div className="grid grid-cols-2 gap-2 sm:hidden pb-4 border-b border-[var(--border-subtle)]">
            {onToggleHero && (
              <button
                onClick={() => onToggleHero(item.id)}
                className={`min-h-[44px] px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isHero
                    ? 'text-[var(--amber-9)] bg-[var(--amber-3)] hover:bg-[var(--amber-4)]'
                    : 'text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--amber-6)]'
                }`}
              >
                <Trophy className={`w-5 h-5 ${isHero ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">Hero</span>
              </button>
            )}
            <button
              onClick={() => {
                onUpdate(item.id, { is_featured: !item.is_featured });
              }}
              className={`min-h-[44px] px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                item.is_featured
                  ? 'text-[var(--amber-9)] bg-[var(--amber-3)] hover:bg-[var(--amber-4)]'
                  : 'text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--amber-6)]'
              }`}
            >
              <Star className={`w-5 h-5 ${item.is_featured ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{item.is_featured ? 'Featured' : 'Feature'}</span>
            </button>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="min-h-[44px] px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] relative"
            >
              <LinkIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Links</span>
              {itemLinks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--teed-green-9)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {itemLinks.length}
                </span>
              )}
            </button>
            {onItemMoved && (
              <button
                onClick={() => setIsMoveModalOpen(true)}
                className="min-h-[44px] px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--sky-6)]"
              >
                <FolderInput className="w-5 h-5" />
                <span className="text-sm font-medium">Move</span>
              </button>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="min-h-[44px] px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-[var(--copper-9)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--copper-6)] hover:bg-[var(--copper-2)]"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>

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

          {/* Why I Chose This - Prominent display */}
          {item.why_chosen && (
            <div className="bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-lg p-3">
              <h4 className="text-sm font-medium text-[var(--teed-green-11)] mb-1 flex items-center gap-1.5">
                <span className="text-base">💡</span> Why I chose this
              </h4>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{item.why_chosen}</p>
            </div>
          )}

          {/* Compared To */}
          {item.compared_to && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">Compared to / Replaced</h4>
              <p className="text-sm text-[var(--text-secondary)]">{item.compared_to}</p>
            </div>
          )}

          {/* Price & Date */}
          {(item.price_paid || item.purchase_date) && (
            <div className="flex gap-4 text-sm">
              {item.price_paid && (
                <div>
                  <span className="text-[var(--text-tertiary)]">Paid: </span>
                  <span className="font-medium text-[var(--text-primary)]">${item.price_paid.toFixed(2)}</span>
                </div>
              )}
              {item.purchase_date && (
                <div>
                  <span className="text-[var(--text-tertiary)]">Purchased: </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(item.purchase_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}

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


      {/* Link Manager Modal */}
      <LinkManagerModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        itemId={item.id}
        itemName={item.custom_name || 'Item'}
        links={itemLinks}
        onLinksChange={setItemLinks}
        onItemPhotoUpdated={(newPhotoUrl) => {
          // Update the item's photo in the parent state when a video thumbnail is auto-set
          onUpdate(item.id, { photo_url: newPhotoUrl });
        }}
      />

      {/* Move to Bag Modal */}
      {onItemMoved && (
        <MoveToBagModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          itemId={item.id}
          itemName={item.custom_name || 'Item'}
          currentBagId={item.bag_id}
          onItemMoved={(targetBagId, targetBagTitle) => {
            onItemMoved(item.id, targetBagTitle);
          }}
        />
      )}
    </div>
  );
}
