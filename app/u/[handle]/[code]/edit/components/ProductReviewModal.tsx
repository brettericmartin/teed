'use client';

import { useState } from 'react';
import { ChevronDown, Check, X, Palette, Eye, Tag, RefreshCw, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

// Structured color information
interface ProductColors {
  primary: string;
  secondary?: string;
  accent?: string;
  finish?: 'matte' | 'glossy' | 'metallic' | 'satin' | 'textured' | 'brushed';
  colorway?: string;
}

// Pattern recognition
interface ProductPattern {
  type: 'solid' | 'striped' | 'plaid' | 'camo' | 'gradient' | 'geometric' |
        'chevron' | 'heathered' | 'carbon-weave' | 'checkered' | 'floral' | 'other';
  location: 'all-over' | 'accent' | 'trim' | 'crown-only' | 'partial' | 'sole-only';
  description?: string;
}

// Visual brand signature
interface BrandSignature {
  signatureColors?: string[];
  logoShape?: string;
  designCues: string[];
  visualConfidence: number;
}

type ValidationVerdict = 'verified' | 'unverified' | 'mismatch';

export type IdentifiedProduct = {
  name: string;
  brand?: string;
  category: string;
  confidence: number;
  estimatedPrice?: string;
  color?: string;
  colors?: ProductColors;
  pattern?: ProductPattern;
  brandSignature?: BrandSignature;
  specifications?: string[];
  modelNumber?: string;
  productImage?: {
    imageUrl: string;
    thumbnailUrl: string;
    source: string;
  };
  alternatives?: Array<{
    name: string;
    brand?: string;
    confidence: number;
    reason: string;
  }>;
  sourceImageIndex?: number;
  // Vision pipeline fields
  cropBase64?: string;
  validationVerdict?: ValidationVerdict;
  validationReferenceUrl?: string;
};

type ProductReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  products: IdentifiedProduct[];
  totalConfidence: number;
  processingTime: number;
  onAddSelected: (selectedProducts: IdentifiedProduct[]) => Promise<void>;
  onReidentify?: (index: number) => Promise<void>;
  pipelineStats?: {
    totalDetected: number;
    totalIdentified: number;
    totalVerified: number;
  };
};

function ValidationBadge({ verdict }: { verdict?: ValidationVerdict }) {
  if (!verdict) return null;

  const config = {
    verified: {
      icon: ShieldCheck,
      label: 'Verified',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    unverified: {
      icon: ShieldQuestion,
      label: 'Unverified',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    mismatch: {
      icon: ShieldAlert,
      label: 'Mismatch',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  }[verdict];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const getColor = (c: number) => {
    if (c >= 70) return 'bg-green-500';
    if (c >= 50) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(confidence)}`}
          style={{ width: `${Math.min(100, confidence)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{confidence}%</span>
    </div>
  );
}

export default function ProductReviewModal({
  isOpen,
  onClose,
  products,
  totalConfidence,
  processingTime,
  onAddSelected,
  onReidentify,
  pipelineStats,
}: ProductReviewModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(products.map((_, i) => i))
  );
  const [editedProducts, setEditedProducts] = useState<IdentifiedProduct[]>(products);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [reidentifyingIndex, setReidentifyingIndex] = useState<number | null>(null);

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((_, i) => i)));
    }
  };

  const updateProduct = (index: number, field: keyof IdentifiedProduct, value: any) => {
    const updated = [...editedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setEditedProducts(updated);
  };

  const selectAlternative = (productIndex: number, alternative: { name: string; brand?: string }) => {
    const updated = [...editedProducts];
    updated[productIndex] = {
      ...updated[productIndex],
      name: alternative.name,
      brand: alternative.brand,
    };
    setEditedProducts(updated);
  };

  const handleReidentify = async (index: number) => {
    if (!onReidentify) return;
    setReidentifyingIndex(index);
    try {
      await onReidentify(index);
    } finally {
      setReidentifyingIndex(null);
    }
  };

  const handleAddSelected = async () => {
    const selected = editedProducts.filter((_, i) => selectedIds.has(i));
    if (selected.length === 0) return;

    setIsAdding(true);
    try {
      await onAddSelected(selected);
      onClose();
    } catch (error) {
      console.error('Failed to add products:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = selectedIds.size;
  const allSelected = selectedIds.size === products.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-black/50 md:items-center md:justify-center md:p-4">
      <div
        className="hidden md:block fixed inset-0"
        onClick={onClose}
      />

      <div className="relative flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-xl md:shadow-2xl bg-white overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Review Products
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-500">
                {products.length} found
              </p>
              {pipelineStats && (
                <>
                  <span className="text-gray-300">|</span>
                  <p className="text-sm text-gray-500">
                    {pipelineStats.totalVerified} verified
                  </p>
                </>
              )}
              <span className="text-gray-300">|</span>
              <p className="text-sm text-gray-500">
                {(processingTime / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Select All Bar */}
        <div className="flex-shrink-0 px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-3 py-1"
          >
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              allSelected
                ? 'bg-[var(--sky-5)] border-[var(--sky-5)]'
                : 'border-gray-300 bg-white'
            }`}>
              {allSelected && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-sm font-medium text-gray-700">
              Select All
            </span>
          </button>
          <span className="text-sm text-gray-500">
            {selectedCount} selected
          </span>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900">No products found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Try taking another photo with better lighting
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {editedProducts.map((product, index) => {
                const isSelected = selectedIds.has(index);
                const isExpanded = expandedIndex === index;

                return (
                  <div
                    key={index}
                    className={`transition-colors ${isSelected ? 'bg-[var(--sky-2)]' : 'bg-white'}`}
                  >
                    {/* Product Row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Selection checkbox */}
                      <button
                        onClick={() => toggleSelection(index)}
                        className="flex-shrink-0"
                      >
                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[var(--sky-5)] border-[var(--sky-5)] scale-100'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>

                      {/* Crop thumbnail (priority) or product image */}
                      {product.cropBase64 ? (
                        <img
                          src={product.cropBase64}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : product.productImage ? (
                        <img
                          src={product.productImage.thumbnailUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-gray-900 truncate">
                                {product.name}
                              </h3>
                              <ValidationBadge verdict={product.validationVerdict} />
                              {typeof product.sourceImageIndex === 'number' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-[var(--sky-3)] text-[var(--sky-11)] rounded">
                                  Photo {product.sourceImageIndex + 1}
                                </span>
                              )}
                            </div>
                            {product.brand && (
                              <p className="text-sm text-gray-500 truncate">
                                {product.brand}
                                {product.color && <span className="text-gray-400"> · {product.color}</span>}
                              </p>
                            )}
                          </div>
                          {/* Confidence */}
                          <div className="flex-shrink-0">
                            <ConfidenceBar confidence={product.confidence} />
                          </div>
                        </div>
                      </div>

                      {/* Expand button */}
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="flex-shrink-0 p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                      >
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expanded edit section */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 bg-gray-50/50">
                        {/* Side-by-side: Crop vs Reference */}
                        {(product.cropBase64 || product.validationReferenceUrl) && (
                          <div className="flex gap-3">
                            {product.cropBase64 && (
                              <div className="flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">From Photo</p>
                                <img
                                  src={product.cropBase64}
                                  alt="Crop"
                                  className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-white"
                                />
                              </div>
                            )}
                            {product.validationReferenceUrl && (
                              <div className="flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Reference</p>
                                <img
                                  src={product.validationReferenceUrl}
                                  alt="Reference"
                                  className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-white"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Re-identify button */}
                        {onReidentify && product.cropBase64 && (
                          <button
                            onClick={() => handleReidentify(index)}
                            disabled={reidentifyingIndex === index}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--sky-11)] bg-[var(--sky-3)] hover:bg-[var(--sky-4)] rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${reidentifyingIndex === index ? 'animate-spin' : ''}`} />
                            {reidentifyingIndex === index ? 'Re-identifying...' : 'Re-identify This Item'}
                          </button>
                        )}

                        {/* Name input */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                            className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--sky-6)] focus:border-transparent"
                          />
                        </div>

                        {/* Brand input */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Brand (optional)
                          </label>
                          <input
                            type="text"
                            value={product.brand || ''}
                            onChange={(e) => updateProduct(index, 'brand', e.target.value || undefined)}
                            placeholder="Enter brand name"
                            className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--sky-6)] focus:border-transparent"
                          />
                        </div>

                        {/* Category select */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Category
                          </label>
                          <select
                            value={product.category}
                            onChange={(e) => updateProduct(index, 'category', e.target.value)}
                            className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--sky-6)] focus:border-transparent bg-white"
                          >
                            <option value="electronics">Electronics</option>
                            <option value="audio">Audio</option>
                            <option value="computing">Computing</option>
                            <option value="lighting">Lighting</option>
                            <option value="accessories">Accessories</option>
                            <option value="furniture">Furniture</option>
                            <option value="camping">Camping</option>
                            <option value="golf">Golf</option>
                            <option value="hiking">Hiking</option>
                            <option value="travel">Travel</option>
                            <option value="sports">Sports</option>
                            <option value="clothing">Clothing</option>
                            <option value="drinkware">Drinkware</option>
                            <option value="stationery">Stationery</option>
                            <option value="decor">Decor</option>
                            <option value="tools">Tools</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Visual Attributes Section */}
                        {(product.colors || product.pattern || product.brandSignature) && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-3 flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              Visual Details
                            </p>

                            {product.colors && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Palette className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">Colors</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.colors.primary && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                                      <span className="font-medium">Primary:</span>&nbsp;{product.colors.primary}
                                    </span>
                                  )}
                                  {product.colors.secondary && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                                      <span className="font-medium">Secondary:</span>&nbsp;{product.colors.secondary}
                                    </span>
                                  )}
                                  {product.colors.accent && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                                      <span className="font-medium">Accent:</span>&nbsp;{product.colors.accent}
                                    </span>
                                  )}
                                  {product.colors.finish && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md capitalize">
                                      {product.colors.finish}
                                    </span>
                                  )}
                                  {product.colors.colorway && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md">
                                      {product.colors.colorway}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {product.pattern && product.pattern.type !== 'solid' && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-xs text-gray-500">Pattern</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-md capitalize">
                                    {product.pattern.type}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                                    {product.pattern.location.replace('-', ' ')}
                                  </span>
                                  {product.pattern.description && (
                                    <span className="text-xs text-gray-500 italic">
                                      {product.pattern.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {product.brandSignature && product.brandSignature.designCues.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Tag className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    Brand Cues
                                    <span className="ml-1 text-gray-400">
                                      ({product.brandSignature.visualConfidence}% visual match)
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.brandSignature.designCues.slice(0, 4).map((cue, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md"
                                    >
                                      {cue}
                                    </span>
                                  ))}
                                  {product.brandSignature.logoShape && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md">
                                      Logo: {product.brandSignature.logoShape}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Alternatives */}
                        {product.alternatives && product.alternatives.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                              Did you mean one of these?
                            </p>
                            <div className="space-y-2">
                              {product.alternatives.map((alt, altIndex) => (
                                <button
                                  key={altIndex}
                                  onClick={() => {
                                    selectAlternative(index, alt);
                                  }}
                                  className="w-full text-left p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 active:bg-amber-200 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium text-gray-900">{alt.name}</span>
                                      {alt.brand && (
                                        <span className="text-gray-500"> · {alt.brand}</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500">{alt.confidence}%</span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{alt.reason}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isAdding}
              className="flex-1 px-4 py-3.5 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={isAdding || selectedCount === 0}
              className="flex-[2] px-4 py-3.5 text-base font-medium text-[var(--sky-11)] bg-[var(--sky-5)] rounded-xl hover:bg-[var(--sky-6)] active:bg-[var(--sky-7)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Add {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
