'use client';

import { useState } from 'react';
import { Check, Edit2, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react';
import type { IdentifiedProduct, UserCorrection, ProductAlternative } from '@/lib/apis/types';
import { getConfidenceRouting } from '@/lib/apis/types';

interface ProductValidationCheckpointProps {
  products: IdentifiedProduct[];
  onValidate: (confirmed: IdentifiedProduct[], corrections?: UserCorrection[]) => void;
  onCancel: () => void;
}

interface ProductCardProps {
  product: IdentifiedProduct;
  isConfirmed: boolean;
  onToggleConfirm: () => void;
  onEdit: (edited: IdentifiedProduct) => void;
  onSelectAlternative: (alt: ProductAlternative) => void;
}

function ProductCard({
  product,
  isConfirmed,
  onToggleConfirm,
  onEdit,
  onSelectAlternative
}: ProductCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(product.name);
  const [editedBrand, setEditedBrand] = useState(product.brand || '');
  const [editedYear, setEditedYear] = useState(product.modelYear?.toString() || '');

  const routing = getConfidenceRouting(product.confidence);

  const handleSaveEdit = () => {
    onEdit({
      ...product,
      name: editedName,
      brand: editedBrand || undefined,
      modelYear: editedYear ? parseInt(editedYear) : undefined,
      userCorrectionApplied: 'User edited product details'
    });
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (confidence >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div
      className={`
        rounded-xl border-2 overflow-hidden transition-all
        ${isConfirmed
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggleConfirm}
            className={`
              flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5
              transition-all
              ${isConfirmed
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 hover:border-blue-400'
              }
            `}
          >
            {isConfirmed && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Brand</label>
                  <input
                    type="text"
                    value={editedBrand}
                    onChange={(e) => setEditedBrand(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Product Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Model Year</label>
                  <input
                    type="text"
                    value={editedYear}
                    onChange={(e) => setEditedYear(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 2022"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Brand & Name */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.brand && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-gray-800 text-white">
                      {product.brand}
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">
                    {product.name}
                  </span>
                </div>

                {/* Year/Generation */}
                {(product.modelYear || product.generation) && (
                  <div className="flex items-center gap-2 mt-1">
                    {product.modelYear && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {product.modelYear}
                      </span>
                    )}
                    {product.generation && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {product.generation}
                      </span>
                    )}
                    {product.yearConfidence > 0 && product.yearConfidence < 70 && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Year uncertain
                      </span>
                    )}
                  </div>
                )}

                {/* Year cues */}
                {product.yearCues && product.yearCues.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {product.yearCues[0]}
                  </p>
                )}

                {/* Matching reasons */}
                {product.matchingReasons && product.matchingReasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.matchingReasons.slice(0, 3).map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  {product.alternatives && product.alternatives.length > 0 && (
                    <button
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Try alternative
                      {showAlternatives ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Confidence badge */}
          <div className="flex-shrink-0">
            <span
              className={`
                text-xs px-2 py-1 rounded-full border font-medium
                ${getConfidenceColor(product.confidence)}
              `}
            >
              {product.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Alternatives panel */}
      {showAlternatives && product.alternatives && product.alternatives.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500 mb-2">Did you mean one of these?</p>
          <div className="space-y-2">
            {product.alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectAlternative(alt)}
                className="w-full text-left p-2 rounded border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-gray-900">
                      {alt.brand && `${alt.brand} `}{alt.name}
                    </span>
                    {alt.modelYear && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({alt.modelYear})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {alt.confidence}% match
                  </span>
                </div>
                {alt.differentiatingFactors && alt.differentiatingFactors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {alt.differentiatingFactors[0]}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confidence routing message */}
      {routing.level !== 'high' && (
        <div className="border-t border-gray-200 bg-amber-50 px-4 py-2">
          <p className="text-xs text-amber-700">
            {routing.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProductValidationCheckpoint({
  products,
  onValidate,
  onCancel
}: ProductValidationCheckpointProps) {
  const [confirmedProducts, setConfirmedProducts] = useState<Map<string, IdentifiedProduct>>(
    () => {
      const map = new Map();
      // Auto-confirm high confidence products
      products.forEach(p => {
        if (p.confidence >= 80) {
          map.set(p.id, { ...p, confirmedByUser: true });
        }
      });
      return map;
    }
  );

  const toggleConfirm = (product: IdentifiedProduct) => {
    setConfirmedProducts(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, { ...product, confirmedByUser: true });
      }
      return next;
    });
  };

  const handleEdit = (edited: IdentifiedProduct) => {
    setConfirmedProducts(prev => {
      const next = new Map(prev);
      next.set(edited.id, { ...edited, confirmedByUser: true });
      return next;
    });
  };

  const handleSelectAlternative = (productId: string, alt: ProductAlternative) => {
    const original = products.find(p => p.id === productId);
    if (!original) return;

    const updated: IdentifiedProduct = {
      ...original,
      name: alt.name,
      brand: alt.brand,
      modelYear: alt.modelYear,
      confidence: alt.confidence,
      userCorrectionApplied: `Selected alternative: ${alt.brand || ''} ${alt.name}`,
      confirmedByUser: true
    };

    setConfirmedProducts(prev => {
      const next = new Map(prev);
      next.set(updated.id, updated);
      return next;
    });
  };

  const handleContinue = () => {
    const confirmed = Array.from(confirmedProducts.values());

    // Build corrections list
    const corrections: UserCorrection[] = confirmed
      .filter(p => p.userCorrectionApplied)
      .map(p => ({
        stage: 'awaiting-product-validation' as const,
        productId: p.id,
        correctionType: 'product-name' as const,
        correctedValue: p.userCorrectionApplied!,
        timestamp: new Date()
      }));

    onValidate(confirmed, corrections.length > 0 ? corrections : undefined);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Confirm Product Identification</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Review the identified products. Edit or select alternatives if needed.
        </p>
      </div>

      {/* Products list */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={confirmedProducts.get(product.id) || product}
            isConfirmed={confirmedProducts.has(product.id)}
            onToggleConfirm={() => toggleConfirm(product)}
            onEdit={handleEdit}
            onSelectAlternative={(alt) => handleSelectAlternative(product.id, alt)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {confirmedProducts.size} of {products.length} confirmed
          </span>
          <button
            onClick={handleContinue}
            disabled={confirmedProducts.size === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Find Links
          </button>
        </div>
      </div>
    </div>
  );
}
