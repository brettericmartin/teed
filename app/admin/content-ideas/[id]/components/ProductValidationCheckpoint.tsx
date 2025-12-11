'use client';

import { useState } from 'react';
import { Check, Edit2, Save, X, AlertTriangle, Star, Tag, Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import type { ExtractedProduct, ExtractedLink } from '@/lib/types/contentIdeas';

interface ProductValidationCheckpointProps {
  products: ExtractedProduct[];
  videoThumbnail?: string;
  onValidate: (validation: ProductValidation) => void;
  onBack: () => void;
  isLoading?: boolean;
}

// Validation result passed to API
export interface ProductValidation {
  validatedProducts: Array<{
    id: string;
    originalName: string;
    originalBrand?: string;
    name: string;
    brand?: string;
    model?: string;
    category?: string;
    heroScore?: number;
    wasCorrected: boolean;
    correctionNotes?: string;
    links?: ExtractedLink[];
  }>;
  notes?: string;
}

interface EditableLink {
  url: string;
  label: string;
  isAffiliate: boolean;
}

interface EditableProduct {
  id: string;
  originalName: string;
  originalBrand?: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  heroScore: number;
  isEditing: boolean;
  wasCorrected: boolean;
  correctionNotes: string;
  links: EditableLink[];
}

export default function ProductValidationCheckpoint({
  products,
  videoThumbnail,
  onValidate,
  onBack,
  isLoading = false
}: ProductValidationCheckpointProps) {
  // Initialize editable products
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(
    products.map((p, idx) => ({
      id: String(idx),
      originalName: p.name,
      originalBrand: p.brand,
      name: p.name,
      brand: p.brand || '',
      model: p.modelNumber || '',
      category: p.category || '',
      heroScore: p.heroScore || 50,
      isEditing: false,
      wasCorrected: false,
      correctionNotes: '',
      links: (p.links || []).map(l => ({
        url: l.url,
        label: l.label || l.productHint || '',
        isAffiliate: l.isAffiliate,
      })),
    }))
  );

  const [showNotes, setShowNotes] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');

  const toggleEdit = (id: string) => {
    setEditableProducts(prev => prev.map(p =>
      p.id === id ? { ...p, isEditing: !p.isEditing } : p
    ));
  };

  const updateProduct = (id: string, field: keyof EditableProduct, value: string | number) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id !== id) return p;

      const updated = { ...p, [field]: value };

      // Check if anything was changed from original
      const wasCorrected =
        updated.name !== updated.originalName ||
        updated.brand !== (updated.originalBrand || '') ||
        // For heroScore, check if it changed significantly
        (p.heroScore !== products[parseInt(id)]?.heroScore);

      return { ...updated, wasCorrected };
    }));
  };

  const handleHeroScoreChange = (id: string, value: number) => {
    const originalScore = products[parseInt(id)]?.heroScore || 50;
    setEditableProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        heroScore: value,
        wasCorrected: p.wasCorrected || Math.abs(value - originalScore) > 20,
      };
    }));
  };

  const addLink = (productId: string) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        links: [...p.links, { url: '', label: '', isAffiliate: false }],
      };
    }));
  };

  const removeLink = (productId: string, linkIndex: number) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        links: p.links.filter((_, idx) => idx !== linkIndex),
      };
    }));
  };

  const updateLink = (productId: string, linkIndex: number, field: keyof EditableLink, value: string | boolean) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        links: p.links.map((link, idx) =>
          idx === linkIndex ? { ...link, [field]: value } : link
        ),
      };
    }));
  };

  const handleFinish = () => {
    const validation: ProductValidation = {
      validatedProducts: editableProducts.map(p => ({
        id: p.id,
        originalName: p.originalName,
        originalBrand: p.originalBrand,
        name: p.name,
        brand: p.brand || undefined,
        model: p.model || undefined,
        category: p.category || undefined,
        heroScore: p.heroScore,
        wasCorrected: p.wasCorrected,
        correctionNotes: p.correctionNotes || undefined,
        links: p.links.filter(l => l.url.trim()).length > 0
          ? p.links.filter(l => l.url.trim()).map(l => ({
              url: l.url.trim(),
              domain: new URL(l.url.trim()).hostname,
              label: l.label || undefined,
              isAffiliate: l.isAffiliate,
            }))
          : undefined,
      })),
      notes: generalNotes.trim() || undefined,
    };

    onValidate(validation);
  };

  const getHeroScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const correctedCount = editableProducts.filter(p => p.wasCorrected).length;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">Stage 2: Validate Product Identifications</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Verify the brand, model, and category for each product. Correct any errors.
        </p>
      </div>

      {/* Products list */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {editableProducts.map((product) => (
          <div
            key={product.id}
            className={`
              rounded-lg border-2 transition-all overflow-hidden
              ${product.wasCorrected
                ? 'border-amber-400 bg-amber-50/30'
                : product.isEditing
                  ? 'border-blue-400 bg-blue-50/30'
                  : 'border-gray-200 bg-white'
              }
            `}
          >
            {/* Product header */}
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">
                  {product.originalBrand && (
                    <span className="text-gray-500 mr-1">{product.originalBrand}</span>
                  )}
                  {product.originalName}
                </span>
                {product.wasCorrected && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Corrected
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleEdit(product.id)}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${product.isEditing
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }
                `}
              >
                {product.isEditing ? (
                  <>
                    <Check className="w-4 h-4" /> Done
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" /> Edit
                  </>
                )}
              </button>
            </div>

            {/* Editable fields */}
            {product.isEditing ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={product.brand}
                      onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                      placeholder="e.g., Titleist, Scotty Cameron"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      placeholder="e.g., Special Select Newport 2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Model/SKU (optional)
                    </label>
                    <input
                      type="text"
                      value={product.model}
                      onChange={(e) => updateProduct(product.id, 'model', e.target.value)}
                      placeholder="e.g., 2021, TSR3, Pro V1x"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={product.category}
                      onChange={(e) => updateProduct(product.id, 'category', e.target.value)}
                      placeholder="e.g., Putter, Driver, Ball"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Hero Score slider */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Hero Score: {product.heroScore}
                    <span className="font-normal text-gray-400 ml-2">
                      (How featured/interesting is this product?)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={product.heroScore}
                      onChange={(e) => handleHeroScoreChange(product.id, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getHeroScoreColor(product.heroScore)}`}>
                      {product.heroScore >= 70 ? 'Hero' : product.heroScore >= 50 ? 'Notable' : 'Minor'}
                    </span>
                  </div>
                </div>

                {/* Correction notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Correction Notes (optional)
                  </label>
                  <textarea
                    value={product.correctionNotes}
                    onChange={(e) => updateProduct(product.id, 'correctionNotes', e.target.value)}
                    placeholder="Why did you make this correction? (helps improve future extractions)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                {/* Purchase Links */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <Link2 className="w-3.5 h-3.5" />
                      Purchase Links
                    </label>
                    <button
                      type="button"
                      onClick={() => addLink(product.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Link
                    </button>
                  </div>

                  {product.links.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No links added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {product.links.map((link, linkIdx) => (
                        <div key={linkIdx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(product.id, linkIdx, 'url', e.target.value)}
                              placeholder="https://amazon.com/dp/..."
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) => updateLink(product.id, linkIdx, 'label', e.target.value)}
                                placeholder="Link label (optional)"
                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                              <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={link.isAffiliate}
                                  onChange={(e) => updateLink(product.id, linkIdx, 'isAffiliate', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Affiliate
                              </label>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLink(product.id, linkIdx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Read-only view */
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {product.brand && (
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {product.brand}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-gray-900">
                        {product.name}
                      </span>
                      {product.model && (
                        <span className="text-xs text-gray-400">
                          ({product.model})
                        </span>
                      )}
                    </div>
                    {product.category && (
                      <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                    )}
                    {/* Links display */}
                    {product.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {product.links.map((link, linkIdx) => (
                          <a
                            key={linkIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                              inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded
                              ${link.isAffiliate
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }
                            `}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.label || 'Link'}
                            {link.isAffiliate && <span className="text-[10px]">$</span>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${getHeroScoreColor(product.heroScore)}`}>
                    <Star className="w-3 h-3" />
                    <span className="text-xs font-medium">{product.heroScore}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes section */}
      <div className="px-4 pb-4">
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
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Add general validation notes</span>
        </button>

        {showNotes && (
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Any general notes about this validation (e.g., 'All products are 2024 models', 'Creator is sponsored by Titleist')..."
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={2}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Back to Stage 1
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {editableProducts.length} product{editableProducts.length !== 1 ? 's' : ''}
            {correctedCount > 0 && (
              <span className="text-amber-600 ml-2">
                ({correctedCount} corrected)
              </span>
            )}
          </span>
          <button
            onClick={handleFinish}
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Complete Validation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
