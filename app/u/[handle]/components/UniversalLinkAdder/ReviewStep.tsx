'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Video,
  User,
  ShoppingBag,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { ProcessedEmbed, ProcessedSocial, ProcessedProduct, ReviewTab } from '@/lib/types/universalLink';

interface ReviewStepProps {
  embeds: ProcessedEmbed[];
  social: ProcessedSocial[];
  products: ProcessedProduct[];
  onToggleEmbed: (index: number) => void;
  onToggleSocial: (index: number) => void;
  onToggleProduct: (index: number) => void;
  onUpdateProduct: (index: number, updates: Partial<ProcessedProduct>) => void;
  onChangeProductPhoto: (productIndex: number, photoIndex: number) => void;
}

export default function ReviewStep({
  embeds,
  social,
  products,
  onToggleEmbed,
  onToggleSocial,
  onToggleProduct,
  onUpdateProduct,
  onChangeProductPhoto,
}: ReviewStepProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>(() => {
    // Start with first non-empty tab
    if (embeds.length > 0) return 'embeds';
    if (social.length > 0) return 'social';
    return 'products';
  });

  const tabs: { id: ReviewTab; label: string; count: number; icon: typeof Video }[] = [
    { id: 'embeds', label: 'Embeds', count: embeds.length, icon: Video },
    { id: 'social', label: 'Social', count: social.length, icon: User },
    { id: 'products', label: 'Products', count: products.length, icon: ShoppingBag },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.count === 0}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3
              text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--teed-green-9)]'
                : tab.count === 0
                  ? 'text-[var(--text-tertiary)] cursor-not-allowed'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className={`
              px-1.5 py-0.5 rounded-full text-xs
              ${activeTab === tab.id
                ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                : 'bg-[var(--surface-elevated)] text-[var(--text-tertiary)]'
              }
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'embeds' && (
          <EmbedsTab
            embeds={embeds}
            onToggle={onToggleEmbed}
          />
        )}
        {activeTab === 'social' && (
          <SocialTab
            social={social}
            onToggle={onToggleSocial}
          />
        )}
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onToggle={onToggleProduct}
            onUpdate={onUpdateProduct}
            onChangePhoto={onChangeProductPhoto}
          />
        )}
      </div>
    </div>
  );
}

// ============ Embeds Tab ============

function EmbedsTab({
  embeds,
  onToggle,
}: {
  embeds: ProcessedEmbed[];
  onToggle: (index: number) => void;
}) {
  if (embeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
        <p className="text-[var(--text-secondary)]">No embed links detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {embeds.map((embed) => (
        <div
          key={embed.index}
          className={`
            p-4 rounded-xl border transition-all
            ${embed.selected
              ? 'border-[var(--teed-green-7)] bg-[var(--teed-green-1)]'
              : 'border-[var(--border-subtle)] bg-[var(--surface)]'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            <button
              onClick={() => onToggle(embed.index)}
              className={`
                w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                transition-colors border
                ${embed.selected
                  ? 'bg-[var(--teed-green-9)] border-[var(--teed-green-9)]'
                  : 'bg-[var(--surface)] border-[var(--border-default)] hover:border-[var(--border-hover)]'
                }
              `}
            >
              {embed.selected && <Check className="w-4 h-4 text-white" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                  {embed.platform}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] truncate">{embed.url}</p>
              {embed.title && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">{embed.title}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Social Tab ============

function SocialTab({
  social,
  onToggle,
}: {
  social: ProcessedSocial[];
  onToggle: (index: number) => void;
}) {
  if (social.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
        <p className="text-[var(--text-secondary)]">No social profile links detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {social.map((profile) => (
        <div
          key={profile.index}
          className={`
            p-4 rounded-xl border transition-all
            ${profile.selected
              ? 'border-[var(--teed-green-7)] bg-[var(--teed-green-1)]'
              : 'border-[var(--border-subtle)] bg-[var(--surface)]'
            }
          `}
        >
          <div className="flex items-center gap-3">
            {/* Selection checkbox */}
            <button
              onClick={() => onToggle(profile.index)}
              className={`
                w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
                transition-colors border
                ${profile.selected
                  ? 'bg-[var(--teed-green-9)] border-[var(--teed-green-9)]'
                  : 'bg-[var(--surface)] border-[var(--border-default)] hover:border-[var(--border-hover)]'
                }
              `}
            >
              {profile.selected && <Check className="w-4 h-4 text-white" />}
            </button>

            {/* Platform icon */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {profile.displayName}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                @{profile.username}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Products Tab ============

function ProductsTab({
  products,
  onToggle,
  onUpdate,
  onChangePhoto,
}: {
  products: ProcessedProduct[];
  onToggle: (index: number) => void;
  onUpdate: (index: number, updates: Partial<ProcessedProduct>) => void;
  onChangePhoto: (productIndex: number, photoIndex: number) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
        <p className="text-[var(--text-secondary)]">No product links detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard
          key={product.index}
          product={product}
          onToggle={() => onToggle(product.index)}
          onUpdate={(updates) => onUpdate(product.index, updates)}
          onChangePhoto={(photoIndex) => onChangePhoto(product.index, photoIndex)}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onToggle,
  onUpdate,
  onChangePhoto,
}: {
  product: ProcessedProduct;
  onToggle: () => void;
  onUpdate: (updates: Partial<ProcessedProduct>) => void;
  onChangePhoto: (photoIndex: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(product.productName);
  const [editBrand, setEditBrand] = useState(product.brand || '');

  const handleSaveEdit = () => {
    onUpdate({
      productName: editName,
      brand: editBrand || null,
    });
    setIsEditing(false);
  };

  const selectedPhoto = product.photos[product.selectedPhotoIndex];

  return (
    <div
      className={`
        rounded-xl border overflow-hidden transition-all
        ${product.selected
          ? 'border-[var(--teed-green-7)] bg-[var(--teed-green-1)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface)]'
        }
      `}
    >
      {/* Header with selection */}
      <div className="p-4 flex items-start gap-3">
        {/* Selection checkbox */}
        <button
          onClick={onToggle}
          className={`
            w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
            transition-colors border
            ${product.selected
              ? 'bg-[var(--teed-green-9)] border-[var(--teed-green-9)]'
              : 'bg-[var(--surface)] border-[var(--border-default)] hover:border-[var(--border-hover)]'
            }
          `}
        >
          {product.selected && <Check className="w-4 h-4 text-white" />}
        </button>

        {/* Photo */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0 relative">
          {selectedPhoto ? (
            <Image
              src={selectedPhoto.url}
              alt={product.productName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Product name"
                className="w-full px-2 py-1 text-sm rounded border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                autoFocus
              />
              <input
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                placeholder="Brand (optional)"
                className="w-full px-2 py-1 text-sm rounded border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-medium rounded bg-[var(--teed-green-9)] text-white hover:bg-[var(--teed-green-10)]"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                {product.brand && (
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {product.brand}
                  </span>
                )}
                {product.status === 'partial' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                {product.confidence >= 0.8 && (
                  <Sparkles className="w-3.5 h-3.5 text-[var(--teed-green-9)]" />
                )}
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                {product.productName}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-[var(--teed-green-9)] hover:underline mt-1"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Photo selector */}
      {product.photos.length > 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-2">
            Select photo ({product.photos.length} available)
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => onChangePhoto(idx)}
                className={`
                  w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative
                  border-2 transition-colors
                  ${idx === product.selectedPhotoIndex
                    ? 'border-[var(--teed-green-9)]'
                    : 'border-transparent hover:border-[var(--border-hover)]'
                  }
                `}
              >
                <Image
                  src={photo.url}
                  alt={`Option ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {idx === product.selectedPhotoIndex && (
                  <div className="absolute inset-0 bg-[var(--teed-green-9)]/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      {product.status !== 'success' && (
        <div className={`
          px-4 py-2 text-xs
          ${product.status === 'partial'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-red-50 text-red-700'
          }
        `}>
          {product.status === 'partial'
            ? 'Partial data - some fields may need manual entry'
            : 'Failed to fetch product data'
          }
        </div>
      )}
    </div>
  );
}
