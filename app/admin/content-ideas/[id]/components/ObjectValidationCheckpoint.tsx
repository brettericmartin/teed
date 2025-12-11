'use client';

import { useState } from 'react';
import { Check, X, Plus, AlertCircle, Eye, Video, FileText, Image } from 'lucide-react';
import type { ExtractedProduct, ExtractionMetadata } from '@/lib/types/contentIdeas';

interface ObjectValidationCheckpointProps {
  products: ExtractedProduct[];
  extractionMetadata?: ExtractionMetadata;
  videoThumbnail?: string;
  onValidate: (validation: ObjectValidation) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Validation result passed to API
export interface ObjectValidation {
  confirmedProducts: Array<{
    id: string;
    name: string;
    brand?: string;
    category?: string;
    confirmed: boolean;
  }>;
  addedProducts: Array<{
    name: string;
    brand?: string;
    category?: string;
    source: 'admin_added';
    notes?: string;
  }>;
  contentType: 'single_hero' | 'roundup' | 'comparison';
  contentTypeCorrected: boolean;
  notes?: string;
}

export default function ObjectValidationCheckpoint({
  products,
  extractionMetadata,
  videoThumbnail,
  onValidate,
  onCancel,
  isLoading = false
}: ObjectValidationCheckpointProps) {
  // Initialize all products as selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(products.map((_, idx) => String(idx)))
  );

  // Content type management
  const detectedType = extractionMetadata?.contentType || 'single_hero';
  const [contentType, setContentType] = useState<'single_hero' | 'roundup' | 'comparison'>(detectedType);
  const [contentTypeCorrected, setContentTypeCorrected] = useState(false);

  // Add product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [addedProducts, setAddedProducts] = useState<Array<{
    name: string;
    brand?: string;
    category?: string;
  }>>([]);

  // Notes
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContentTypeChange = (newType: 'single_hero' | 'roundup' | 'comparison') => {
    setContentType(newType);
    setContentTypeCorrected(newType !== detectedType);
  };

  const handleAddProduct = () => {
    if (!newProductName.trim()) return;

    setAddedProducts(prev => [...prev, {
      name: newProductName.trim(),
      brand: newProductBrand.trim() || undefined,
      category: newProductCategory.trim() || undefined,
    }]);

    setNewProductName('');
    setNewProductBrand('');
    setNewProductCategory('');
    setShowAddProduct(false);
  };

  const removeAddedProduct = (index: number) => {
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const validation: ObjectValidation = {
      confirmedProducts: products.map((p, idx) => ({
        id: String(idx),
        name: p.name,
        brand: p.brand,
        category: p.category,
        confirmed: selectedIds.has(String(idx)),
      })),
      addedProducts: addedProducts.map(p => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
        source: 'admin_added' as const,
      })),
      contentType,
      contentTypeCorrected,
      notes: notes.trim() || undefined,
    };

    onValidate(validation);
  };

  const totalSelected = selectedIds.size + addedProducts.length;

  // Source badge rendering
  const getSourceBadge = (product: ExtractedProduct) => {
    const sources: string[] = [];
    if (product.mentionContext?.includes('description')) sources.push('desc');
    if (product.mentionContext?.includes('transcript')) sources.push('transcript');
    if (product.mentionContext?.includes('frame')) sources.push('frame');

    // If no sources found in mentionContext, check if it's a generic product
    if (sources.length === 0 && product.matchedCatalogItemId) {
      sources.push('catalog');
    }

    return sources;
  };

  const getConfidenceColor = (heroScore?: number) => {
    if (!heroScore) return 'bg-gray-100 text-gray-600';
    if (heroScore >= 80) return 'bg-emerald-100 text-emerald-700';
    if (heroScore >= 60) return 'bg-blue-100 text-blue-700';
    if (heroScore >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Stage 1: Review Detected Products</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Confirm which products were correctly detected. Uncheck any false positives and add any we missed.
        </p>

        {/* Extraction sources indicator */}
        {extractionMetadata?.extractionSources && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Sources:</span>
            {extractionMetadata.extractionSources.description && (
              <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                <FileText className="w-3 h-3" /> Description
              </span>
            )}
            {extractionMetadata.extractionSources.transcript && (
              <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                <Video className="w-3 h-3" /> Transcript
              </span>
            )}
            {extractionMetadata.extractionSources.frames && (
              <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                <Image className="w-3 h-3" /> Frames ({extractionMetadata.framesAnalyzed || 0})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Type Selection */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Content Type:</span>
          <div className="flex gap-2">
            {(['single_hero', 'roundup', 'comparison'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleContentTypeChange(type)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${contentType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                  }
                `}
              >
                {type === 'single_hero' ? 'Single Hero' :
                 type === 'roundup' ? 'Roundup/Collection' : 'Comparison'}
              </button>
            ))}
          </div>
          {contentTypeCorrected && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Changed from: {detectedType}
            </span>
          )}
        </div>
        {extractionMetadata?.contentTypeSignals && (
          <div className="mt-1 text-xs text-gray-500">
            {/* Handle both old format (string[]) and new format (object with titleSignals) */}
            {Array.isArray(extractionMetadata.contentTypeSignals)
              ? `Detected signals: ${extractionMetadata.contentTypeSignals.slice(0, 3).join(', ')}`
              : extractionMetadata.contentTypeSignals.titleSignals?.length > 0
                ? `Detected signals: ${extractionMetadata.contentTypeSignals.titleSignals.slice(0, 3).join(', ')}`
                : null
            }
            {!Array.isArray(extractionMetadata.contentTypeSignals) && extractionMetadata.contentTypeSignals.confidence && (
              <span className="ml-2">
                (confidence: {Math.round(extractionMetadata.contentTypeSignals.confidence * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products list */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No products detected from extraction.</p>
            <p className="text-sm mt-1">Add products manually below.</p>
          </div>
        ) : (
          products.map((product, idx) => {
            const id = String(idx);
            const isSelected = selectedIds.has(id);
            const sources = getSourceBadge(product);

            return (
              <button
                key={id}
                onClick={() => toggleSelection(id)}
                className={`
                  w-full text-left p-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 opacity-60'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                      ${isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.brand && (
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {product.brand}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {product.name}
                      </span>
                      {product.heroScore && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(product.heroScore)}`}>
                          Hero: {product.heroScore}
                        </span>
                      )}
                    </div>

                    {/* Category and sources */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {product.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      )}
                      {sources.map((source, i) => (
                        <span
                          key={i}
                          className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded"
                        >
                          {source}
                        </span>
                      ))}
                    </div>

                    {/* Story signals */}
                    {product.storySignals && product.storySignals.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.storySignals.slice(0, 2).map((signal, i) => (
                          <span
                            key={i}
                            className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Mention context */}
                    {product.mentionContext && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {product.mentionContext}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}

        {/* Admin-added products */}
        {addedProducts.map((product, index) => (
          <div
            key={`added-${index}`}
            className="w-full p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center mt-0.5">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {product.brand && (
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {product.brand}
                    </span>
                  )}
                  <span className="font-medium text-gray-900">
                    {product.name}
                  </span>
                  <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    Added by you
                  </span>
                </div>
                {product.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {product.category}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAddedProduct(index);
                }}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add product section */}
      <div className="px-4 pb-4 space-y-3">
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
            ${showAddProduct
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700'
            }
          `}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add a missed product</span>
        </button>

        {showAddProduct && (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Product name (e.g., 'Scotty Cameron Newport 2')"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newProductBrand}
                onChange={(e) => setNewProductBrand(e.target.value)}
                placeholder="Brand (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                placeholder="Category (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddProduct}
              disabled={!newProductName.trim()}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Add Product
            </button>
          </div>
        )}

        {/* Notes section */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
            ${showNotes
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
            }
          `}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Add validation notes</span>
        </button>

        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes about the extraction (e.g., 'Multiple products shown but not mentioned', 'Title is misleading')..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={2}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalSelected} product{totalSelected !== 1 ? 's' : ''} confirmed
            {products.length > 0 && selectedIds.size < products.length && (
              <span className="text-amber-600 ml-2">
                ({products.length - selectedIds.size} rejected)
              </span>
            )}
          </span>
          <button
            onClick={handleContinue}
            disabled={totalSelected === 0 || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue to Product ID'}
          </button>
        </div>
      </div>
    </div>
  );
}
