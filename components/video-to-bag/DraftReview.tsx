'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, X, ExternalLink, Pencil, Link2, Video, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { DraftBag, DraftProduct, ProductSource } from '@/lib/videoPipeline/types';

// ═══════════════════════════════════════════════════════════════════
// Source Badge
// ═══════════════════════════════════════════════════════════════════

const SOURCE_COLORS: Record<ProductSource, string> = {
  description: 'bg-blue-100 text-blue-700',
  transcript: 'bg-purple-100 text-purple-700',
  vision: 'bg-amber-100 text-amber-700',
};

const SOURCE_LABELS: Record<ProductSource, string> = {
  description: 'Desc',
  transcript: 'Transcript',
  vision: 'Vision',
};

function SourceBadge({ source }: { source: ProductSource }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SOURCE_COLORS[source]}`}>
      {SOURCE_LABELS[source]}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 75 ? 'text-green-600' : confidence >= 50 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`text-xs font-mono ${color}`}>{confidence}%</span>
  );
}

/** Proxy external image URLs through our API to avoid CORS issues */
function proxyUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ═══════════════════════════════════════════════════════════════════
// Dual Image Display
// ═══════════════════════════════════════════════════════════════════

function DualImageDisplay({
  videoFrameUrl,
  productImageUrl,
  timestamp,
  name,
  selectedImageUrl,
  onSelectImage,
}: {
  videoFrameUrl?: string;
  productImageUrl?: string;
  timestamp?: string;
  name: string;
  selectedImageUrl?: string;
  onSelectImage?: (url: string) => void;
}) {
  const hasFrame = !!videoFrameUrl;
  const hasProduct = !!productImageUrl;
  const canChoose = hasFrame && hasProduct && onSelectImage;

  // Which image is currently selected for the bag item?
  // Default: product image if available, else frame
  const activeUrl = selectedImageUrl || productImageUrl || videoFrameUrl;
  const frameSelected = activeUrl === videoFrameUrl;
  const productSelected = activeUrl === productImageUrl;

  if (!hasFrame && !hasProduct) {
    return (
      <div className="aspect-[2/1] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
        No images
      </div>
    );
  }

  // Single image (full width) — no choice needed
  if (!hasFrame || !hasProduct) {
    const url = hasProduct ? productImageUrl : videoFrameUrl;
    const isFrame = !hasProduct;
    return (
      <div className="relative aspect-[2/1] bg-gray-100 rounded-t-[10px] overflow-hidden">
        <Image
          src={proxyUrl(url)!}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />
        {isFrame && timestamp && (
          <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
            {timestamp}
          </span>
        )}
        <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
          {isFrame ? <><Video className="w-2.5 h-2.5" /> Frame</> : <><ShoppingBag className="w-2.5 h-2.5" /> Product</>}
        </span>
      </div>
    );
  }

  // Dual images side-by-side — click to choose which goes in the bag
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-2 gap-1 aspect-[2/1]">
        {/* Video frame */}
        <button
          type="button"
          onClick={() => onSelectImage?.(videoFrameUrl!)}
          className={`relative bg-gray-100 rounded-tl-[10px] overflow-hidden ${
            canChoose ? 'cursor-pointer' : ''
          } ${canChoose && frameSelected ? 'ring-2 ring-inset ring-[var(--color-deep-evergreen)]' : ''}`}
        >
          <Image
            src={proxyUrl(videoFrameUrl)!}
            alt={`${name} - video frame`}
            fill
            className="object-cover"
            unoptimized
          />
          {timestamp && (
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
              {timestamp}
            </span>
          )}
          <span className="absolute top-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Video className="w-2.5 h-2.5" /> Frame
          </span>
          {canChoose && frameSelected && (
            <span className="absolute bottom-1 right-1 text-[10px] bg-[var(--color-deep-evergreen)] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Using
            </span>
          )}
        </button>
        {/* Product image */}
        <button
          type="button"
          onClick={() => onSelectImage?.(productImageUrl!)}
          className={`relative bg-gray-100 rounded-tr-[10px] overflow-hidden ${
            canChoose ? 'cursor-pointer' : ''
          } ${canChoose && productSelected ? 'ring-2 ring-inset ring-[var(--color-deep-evergreen)]' : ''}`}
        >
          <Image
            src={proxyUrl(productImageUrl)!}
            alt={`${name} - product`}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <ShoppingBag className="w-2.5 h-2.5" /> Product
          </span>
          {canChoose && productSelected && (
            <span className="absolute bottom-1 right-1 text-[10px] bg-[var(--color-deep-evergreen)] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Using
            </span>
          )}
        </button>
      </div>
      {canChoose && (
        <p className="text-[10px] text-gray-400 text-center py-0.5">Click an image to use it in the bag</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Product Card (wide layout)
// ═══════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: DraftProduct;
  selected: boolean;
  onToggle: () => void;
  editedName?: string;
  editedBrand?: string;
  editedImageUrl?: string;
  onEdit: (field: 'name' | 'brand' | 'imageUrl', value: string) => void;
}

function ProductCard({ product, selected, onToggle, editedName, editedBrand, editedImageUrl, onEdit }: ProductCardProps) {
  const [editing, setEditing] = useState(false);
  const name = editedName ?? product.name;
  const brand = editedBrand ?? product.brand;

  // If user chose a different image, reflect that
  const displayProductImage = editedImageUrl ?? product.productImageUrl;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        selected
          ? 'border-[var(--color-deep-evergreen)] bg-white shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-50'
      }`}
    >
      {/* Dual images — click to choose which photo goes in the bag */}
      <DualImageDisplay
        videoFrameUrl={product.videoFrameUrl}
        productImageUrl={displayProductImage}
        timestamp={product.timestamp}
        name={name}
        selectedImageUrl={editedImageUrl}
        onSelectImage={(url) => onEdit('imageUrl', url)}
      />

      {/* Content */}
      <div className="p-3 space-y-2">
        {editing ? (
          <div className="space-y-1.5">
            <input
              type="text"
              value={brand}
              onChange={(e) => onEdit('brand', e.target.value)}
              placeholder="Brand"
              className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-deep-evergreen)]"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => onEdit('name', e.target.value)}
              placeholder="Product name"
              className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-deep-evergreen)]"
            />
            {/* Image picker: choose which URL to use for the bag item */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-medium">Bag item image</label>
              <div className="flex gap-1.5">
                {product.productImageUrl && (
                  <button
                    onClick={() => onEdit('imageUrl', product.productImageUrl!)}
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      (editedImageUrl ?? product.productImageUrl) === product.productImageUrl
                        ? 'border-[var(--color-deep-evergreen)] bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Product photo
                  </button>
                )}
                {product.videoFrameUrl && (
                  <button
                    onClick={() => onEdit('imageUrl', product.videoFrameUrl!)}
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      editedImageUrl === product.videoFrameUrl
                        ? 'border-[var(--color-deep-evergreen)] bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Video frame
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-[var(--color-deep-evergreen)] font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                {brand && (
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">
                    {brand}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                  {name}
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Mention context (what creator said) */}
        {product.description && !editing && (
          <p className="text-xs text-gray-500 italic line-clamp-2">
            &ldquo;{product.description}&rdquo;
          </p>
        )}

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.sources.map(s => (
            <SourceBadge key={s} source={s} />
          ))}
          <ConfidenceBadge confidence={product.confidence} />
        </div>

        {/* Links */}
        {product.purchaseLinks.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Link2 className="w-3 h-3" />
            <span>{product.purchaseLinks.length} link{product.purchaseLinks.length > 1 ? 's' : ''}</span>
            <a
              href={product.purchaseLinks[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 ml-1"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Include/Exclude toggle bar */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-b-[10px] transition-colors ${
          selected
            ? 'bg-[var(--color-deep-evergreen)] text-white hover:bg-[var(--color-deep-evergreen)]/90'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {selected ? (
          <><Check className="w-3.5 h-3.5" /> Included</>
        ) : (
          <><X className="w-3.5 h-3.5" /> Excluded — click to include</>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Draft Review
// ═══════════════════════════════════════════════════════════════════

interface DraftReviewProps {
  draftBag: DraftBag;
  onCreateBag: (data: {
    selectedProductIds: string[];
    editedProducts: Record<string, { name?: string; brand?: string; imageUrl?: string }>;
    bagTitle: string;
    bagDescription: string;
  }) => void;
  isCreating: boolean;
}

export default function DraftReview({ draftBag, onCreateBag, isCreating }: DraftReviewProps) {
  // Auto-select products that look like real identifications.
  // Low-confidence or generic items (no brand, <60%) default to deselected.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const p of draftBag.products) {
      const hasRealBrand = p.brand && p.brand !== 'Unknown' && p.brand !== 'unknown';
      const isHighConfidence = p.confidence >= 60;
      if (hasRealBrand || isHighConfidence) {
        ids.add(p.id);
      }
    }
    return ids;
  });
  const [edits, setEdits] = useState<Record<string, { name?: string; brand?: string; imageUrl?: string }>>({});
  const [bagTitle, setBagTitle] = useState(draftBag.title);
  const [bagDescription, setBagDescription] = useState(draftBag.description);

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editProduct = (id: string, field: 'name' | 'brand' | 'imageUrl', value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const selectAll = () => setSelectedIds(new Set(draftBag.products.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleCreate = () => {
    onCreateBag({
      selectedProductIds: Array.from(selectedIds),
      editedProducts: edits,
      bagTitle,
      bagDescription,
    });
  };

  return (
    <div className="space-y-6">
      {/* Bag title and description */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bag Title</label>
          <input
            type="text"
            value={bagTitle}
            onChange={(e) => setBagTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-evergreen)]/20 focus:border-[var(--color-deep-evergreen)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={bagDescription}
            onChange={(e) => setBagDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-evergreen)]/20 focus:border-[var(--color-deep-evergreen)] resize-none"
          />
        </div>
      </div>

      {/* Selection controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {selectedIds.size} of {draftBag.products.length} selected
          </span>
          <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
            Select all
          </button>
          <button onClick={deselectAll} className="text-xs text-gray-500 hover:underline">
            Deselect all
          </button>
        </div>
      </div>

      {/* Product grid — wider cards for dual images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...draftBag.products]
          .sort((a, b) => {
            // Selected items first, then by confidence descending
            const aSelected = selectedIds.has(a.id) ? 1 : 0;
            const bSelected = selectedIds.has(b.id) ? 1 : 0;
            if (aSelected !== bSelected) return bSelected - aSelected;
            return b.confidence - a.confidence;
          })
          .map(product => (
          <ProductCard
            key={product.id}
            product={product}
            selected={selectedIds.has(product.id)}
            onToggle={() => toggleProduct(product.id)}
            editedName={edits[product.id]?.name}
            editedBrand={edits[product.id]?.brand}
            editedImageUrl={edits[product.id]?.imageUrl}
            onEdit={(field, value) => editProduct(product.id, field, value)}
          />
        ))}
      </div>

      {/* Create button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          variant="create"
          size="lg"
          onClick={handleCreate}
          disabled={selectedIds.size === 0 || isCreating || !bagTitle.trim()}
        >
          {isCreating ? 'Creating Bag...' : `Create Bag with ${selectedIds.size} Items`}
        </Button>
      </div>
    </div>
  );
}
