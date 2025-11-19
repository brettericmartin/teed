'use client';

import { useState } from 'react';

export type IdentifiedProduct = {
  name: string;
  brand?: string;
  category: string;
  confidence: number;
  estimatedPrice?: string;
  color?: string;
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
};

type ProductReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  products: IdentifiedProduct[];
  totalConfidence: number;
  processingTime: number;
  onAddSelected: (selectedProducts: IdentifiedProduct[]) => Promise<void>;
};

export default function ProductReviewModal({
  isOpen,
  onClose,
  products,
  totalConfidence,
  processingTime,
  onAddSelected,
}: ProductReviewModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(products.map((_, i) => i)) // All selected by default
  );
  const [editedProducts, setEditedProducts] = useState<IdentifiedProduct[]>(products);
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddSelected = async () => {
    const selected = editedProducts.filter((_, i) => selectedIds.has(i));

    if (selected.length === 0) {
      return;
    }

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start md:items-center justify-center md:p-4">
        <div className="relative bg-white md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Identified Products
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>{products.length} products found</span>
                <span>•</span>
                <span>{totalConfidence}% confidence</span>
                <span>•</span>
                <span>{processingTime}ms</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 active:bg-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Select All */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({products.length})
              </span>
            </label>
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products identified</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try taking another photo with better lighting
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {editedProducts.map((product, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedIds.has(index)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(index)}
                        onChange={() => toggleSelection(index)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Product Image */}
                      {product.productImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={product.productImage.thumbnailUrl}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="text-xs text-gray-500 mt-1 text-center truncate max-w-[80px]">
                            {product.productImage.source}
                          </div>
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 space-y-3">
                        {/* Name and Brand */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product Name
                            </label>
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => updateProduct(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Brand (optional)
                            </label>
                            <input
                              type="text"
                              value={product.brand || ''}
                              onChange={(e) => updateProduct(index, 'brand', e.target.value || undefined)}
                              placeholder="Brand name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Category and Confidence */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">Category:</span>
                            <select
                              value={product.category}
                              onChange={(e) => updateProduct(index, 'category', e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="camping">Camping</option>
                              <option value="golf">Golf</option>
                              <option value="hiking">Hiking</option>
                              <option value="travel">Travel</option>
                              <option value="sports">Sports</option>
                              <option value="electronics">Electronics</option>
                              <option value="clothing">Clothing</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">Confidence:</span>
                            <div className="flex items-center gap-1">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    product.confidence >= 70
                                      ? 'bg-green-500'
                                      : product.confidence >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${product.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{product.confidence}%</span>
                            </div>
                          </div>

                          {product.estimatedPrice && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Price:</span>
                              <span className="text-xs text-gray-600">{product.estimatedPrice}</span>
                            </div>
                          )}
                        </div>

                        {/* Model Number */}
                        {product.modelNumber && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-700">Model:</span>
                            <span className="text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {product.modelNumber}
                            </span>
                          </div>
                        )}

                        {/* Additional Info */}
                        {(product.color || (product.specifications && product.specifications.length > 0)) && (
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            {product.color && (
                              <span>Color: {product.color}</span>
                            )}
                            {product.specifications && product.specifications.length > 0 && (
                              <span>Specs: {product.specifications.join(', ')}</span>
                            )}
                          </div>
                        )}

                        {/* Alternatives Section - Show when confidence < 70 */}
                        {product.alternatives && product.alternatives.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              Alternative Identifications:
                            </div>
                            <div className="space-y-2">
                              {product.alternatives.map((alt, altIndex) => (
                                <div
                                  key={altIndex}
                                  className="flex items-start justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded p-2"
                                >
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-900">
                                      {alt.name}
                                      {alt.brand && (
                                        <span className="text-gray-600"> ({alt.brand})</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                      {alt.reason}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="h-1.5 rounded-full bg-yellow-500"
                                          style={{ width: `${alt.confidence}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500">{alt.confidence}%</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => selectAlternative(index, alt)}
                                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                  >
                                    Use This
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={isAdding}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={isAdding || selectedCount === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Adding...
                </>
              ) : (
                `Add ${selectedCount} ${selectedCount === 1 ? 'Item' : 'Items'} to Bag`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
