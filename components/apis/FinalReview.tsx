'use client';

import { useState } from 'react';
import {
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import type { ValidatedProduct, ProductLink } from '@/lib/apis/types';

interface FinalReviewProps {
  products: ValidatedProduct[];
  sourceImage?: string;
  sourceImages?: string[];  // For bulk mode - array of source images
  onAddToBag: (product: ValidatedProduct) => void;
  onEdit: (product: ValidatedProduct) => void;
  onSkip: (productId: string) => void;
  onStartOver: () => void;
  isBulkMode?: boolean;
  addedCount?: number;
  onDone?: () => void;
}

interface ProductReviewCardProps {
  product: ValidatedProduct;
  sourceImage?: string;
  onAdd: () => void;
  onEdit: () => void;
  onSkip: () => void;
}

function ProductReviewCard({
  product,
  sourceImage,
  onAdd,
  onEdit,
  onSkip
}: ProductReviewCardProps) {
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  const validation = product.validation;
  const confidence = product.finalConfidence;

  const getRecommendationStyle = () => {
    switch (validation?.recommendation) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          text: 'text-emerald-700',
          icon: <Check className="w-5 h-5" />,
          label: 'Validated Match'
        };
      case 'likely':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-700',
          icon: <Check className="w-5 h-5" />,
          label: 'Likely Match'
        };
      case 'uncertain':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-700',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Uncertain Match'
        };
      case 'mismatch':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-700',
          icon: <X className="w-5 h-5" />,
          label: 'Possible Mismatch'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'Not Validated'
        };
    }
  };

  const style = getRecommendationStyle();

  const displayLinks = showAllLinks ? product.links : product.links?.slice(0, 2);

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${style.border} ${style.bg}`}>
      {/* Header with confidence */}
      <div className={`px-4 py-2 flex items-center justify-between ${style.bg} border-b ${style.border}`}>
        <div className={`flex items-center gap-2 ${style.text}`}>
          {style.icon}
          <span className="font-medium">{style.label}</span>
        </div>
        <div className={`text-lg font-bold ${style.text}`}>
          {confidence}%
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          {/* Source image */}
          {sourceImage && (
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Your Image</p>
              <div className="aspect-square w-full max-w-[150px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={sourceImage}
                  alt="Your image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Found product image */}
          {product.productImage?.imageUrl && (
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Found Product</p>
              <div className="aspect-square w-full max-w-[150px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(product.productImage.imageUrl)}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="space-y-2">
          {/* Brand & Name */}
          <div>
            {product.brand && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-gray-800 text-white mr-2">
                {product.brand}
              </span>
            )}
            <span className="font-bold text-gray-900 text-lg">
              {product.name}
            </span>
          </div>

          {/* Year/Generation */}
          {(product.modelYear || product.generation) && (
            <div className="flex items-center gap-2">
              {product.modelYear && (
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                  {product.modelYear}
                </span>
              )}
              {product.generation && (
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                  {product.generation}
                </span>
              )}
            </div>
          )}

          {/* Specs */}
          {product.specs && (
            <p className="text-sm text-gray-600">
              {product.specs}
            </p>
          )}

          {/* Price */}
          {product.estimatedPrice && (
            <p className="text-sm font-medium text-gray-900">
              Est. Price: {product.estimatedPrice}
            </p>
          )}
        </div>

        {/* Match details toggle */}
        {validation && (
          <button
            onClick={() => setShowMatchDetails(!showMatchDetails)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showMatchDetails ? 'Hide match details' : 'Show match details'}
          </button>
        )}

        {/* Match details */}
        {showMatchDetails && validation && (
          <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200 text-xs space-y-1">
            {Object.entries(validation.matchDetails).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">
                  {key.replace(/Match$/, '').replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  {value.matches ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span className={value.matches ? 'text-emerald-600' : 'text-red-600'}>
                    {value.confidence}%
                  </span>
                </div>
              </div>
            ))}

            {/* Discrepancies */}
            {validation.discrepancies && validation.discrepancies.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="font-medium text-amber-700 mb-1">Notes:</p>
                <ul className="list-disc list-inside text-amber-600 space-y-0.5">
                  {validation.discrepancies.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Links */}
        {product.links && product.links.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Links Found:</p>
            <div className="space-y-2">
              {displayLinks?.map((link, idx) => (
                <LinkRow key={idx} link={link} />
              ))}
            </div>
            {product.links.length > 2 && (
              <button
                onClick={() => setShowAllLinks(!showAllLinks)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllLinks ? 'Show less' : `Show ${product.links.length - 2} more links`}
              </button>
            )}
          </div>
        )}

        {/* Fun facts */}
        {product.funFacts && product.funFacts.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Fun Fact</span>
            </div>
            <p className="text-sm text-purple-800">
              {product.funFacts[0]}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-white/50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            Skip
          </button>
        </div>
        <button
          onClick={onAdd}
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Add to Bag
        </button>
      </div>
    </div>
  );
}

function LinkRow({ link }: { link: ProductLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          {link.merchant}
        </span>
        {link.yearMatch === 'different' && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Different year
          </span>
        )}
        {link.isAffiliate && (
          <span className="text-xs text-gray-400">
            (affiliate)
          </span>
        )}
      </div>
      {link.price && (
        <span className="text-sm font-medium text-gray-900">
          {link.price}
        </span>
      )}
    </a>
  );
}

export default function FinalReview({
  products,
  sourceImage,
  sourceImages,
  onAddToBag,
  onEdit,
  onSkip,
  onStartOver,
  isBulkMode,
  addedCount = 0,
  onDone
}: FinalReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAdd = (product: ValidatedProduct) => {
    onAddToBag(product);
    // Move to next product
    if (currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = (productId: string) => {
    onSkip(productId);
    // Move to next product
    if (currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Get the appropriate source image for the current product
  const getSourceImageForProduct = (product: ValidatedProduct) => {
    // If product has a sourceImageIndex and we have sourceImages, use that
    if (sourceImages && (product as any).sourceImageIndex !== undefined) {
      return sourceImages[(product as any).sourceImageIndex];
    }
    return sourceImage;
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products to Review</h3>
        <p className="text-gray-600 mb-4">
          We couldn't identify any products. Try again with a different image.
        </p>
        <button
          onClick={onStartOver}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Start Over
        </button>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const isLastProduct = currentIndex >= products.length - 1;

  return (
    <div className="space-y-4">
      {/* Navigation for multiple products */}
      {products.length > 1 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-600">
            Product {currentIndex + 1} of {products.length}
          </span>
          <div className="flex gap-1">
            {products.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${idx === currentIndex
                    ? 'bg-blue-500 w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                  }
                `}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current product card */}
      <ProductReviewCard
        product={currentProduct}
        sourceImage={getSourceImageForProduct(currentProduct)}
        onAdd={() => handleAdd(currentProduct)}
        onEdit={() => onEdit(currentProduct)}
        onSkip={() => handleSkip(currentProduct.id)}
      />

      {/* Bulk mode: Done button after reviewing all */}
      {isBulkMode && isLastProduct && addedCount > 0 && onDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-emerald-800">
                {addedCount} item{addedCount !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-emerald-600">
                Click "Add All" to add them to your bag
              </p>
            </div>
            <button
              onClick={onDone}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
            >
              Add All ({addedCount})
            </button>
          </div>
        </div>
      )}

      {/* Start over button */}
      <div className="text-center">
        <button
          onClick={onStartOver}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Start over with new {isBulkMode ? 'images' : 'image'}
        </button>
      </div>
    </div>
  );
}
