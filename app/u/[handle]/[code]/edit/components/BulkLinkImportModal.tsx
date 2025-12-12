'use client';

import { useState, useCallback } from 'react';
import { X, Check, Loader2, Link as LinkIcon, ChevronDown, ChevronUp, ExternalLink, AlertCircle, Image as ImageIcon } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface PhotoOption {
  url: string;
  source: 'og' | 'meta' | 'json-ld' | 'google';
  isPrimary: boolean;
}

interface ProcessedLinkResult {
  index: number;
  originalUrl: string;
  resolvedUrl: string;
  status: 'success' | 'partial' | 'failed';
  error?: string;
  scraped: {
    title: string | null;
    description: string | null;
    brand: string | null;
    price: string | null;
    image: string | null;
    domain: string;
  } | null;
  analysis: {
    brand: string | null;
    productName: string | null;
    category: string | null;
    specs: string[];
    confidence: number;
  } | null;
  photoOptions: PhotoOption[];
  suggestedItem: {
    custom_name: string;
    brand: string;
    custom_description: string;
  };
}

interface BatchSummary {
  total: number;
  successful: number;
  partial: number;
  failed: number;
  processingTimeMs: number;
}

interface EditedResult extends ProcessedLinkResult {
  isSelected: boolean;
  editedName: string;
  editedBrand: string;
  editedDescription: string;
  selectedPhotoIndex: number;
}

interface BulkLinkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  onItemsAdded: (count: number) => void;
}

type Step = 'input' | 'processing' | 'review';

// ============================================================
// HELPER COMPONENTS
// ============================================================

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let colorClass = 'bg-red-100 text-red-700';
  if (percentage >= 85) {
    colorClass = 'bg-green-100 text-green-700';
  } else if (percentage >= 70) {
    colorClass = 'bg-yellow-100 text-yellow-700';
  } else if (percentage >= 50) {
    colorClass = 'bg-orange-100 text-orange-700';
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
      {percentage}%
    </span>
  );
}

function PhotoGrid({
  photoOptions,
  selectedIndex,
  onSelect,
  itemName,
}: {
  photoOptions: PhotoOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  itemName: string;
}) {
  if (photoOptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
        <div className="text-center">
          <ImageIcon className="w-6 h-6 mx-auto text-gray-400" />
          <p className="text-xs text-gray-500 mt-1">No photos found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {photoOptions.map((photo, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
            selectedIndex === index
              ? 'border-[var(--teed-green-9)] ring-2 ring-[var(--teed-green-9)] ring-offset-1'
              : 'border-gray-200 hover:border-[var(--teed-green-6)]'
          }`}
        >
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(photo.url)}`}
            alt={`${itemName} option ${index + 1}`}
            className="w-full h-full object-contain bg-gray-50"
            loading="lazy"
          />
          {selectedIndex === index && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--teed-green-9)] rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          {photo.isPrimary && selectedIndex !== index && (
            <div className="absolute bottom-0 inset-x-0 bg-gray-800/70 text-white text-[10px] py-0.5 text-center">
              Best
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BulkLinkImportModal({
  isOpen,
  onClose,
  bagCode,
  onItemsAdded,
}: BulkLinkImportModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputText, setInputText] = useState('');
  const [parsedUrls, setParsedUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<EditedResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Parse URLs from input text
  const parseInput = useCallback((text: string) => {
    const lines = text.split(/[\n,\s]+/).filter(Boolean);
    const validUrls: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      let url = line.trim();
      if (!url) continue;

      // Add https:// if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol) && !seen.has(url)) {
          seen.add(url);
          validUrls.push(url);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return validUrls.slice(0, 25);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setParsedUrls(parseInput(text));
  };

  const handleAnalyze = async () => {
    if (parsedUrls.length === 0) return;

    setStep('processing');
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const response = await fetch(`/api/bags/${bagCode}/bulk-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: parsedUrls }),
      });

      if (!response.ok) {
        throw new Error('Failed to process links');
      }

      const data = await response.json();

      // Convert results to editable format
      const editedResults: EditedResult[] = data.results.map((r: ProcessedLinkResult) => ({
        ...r,
        isSelected: r.status !== 'failed',
        editedName: r.suggestedItem.custom_name,
        editedBrand: r.suggestedItem.brand,
        editedDescription: r.suggestedItem.custom_description,
        selectedPhotoIndex: r.photoOptions.findIndex(p => p.isPrimary) || 0,
      }));

      setResults(editedResults);
      setSummary(data.summary);
      setStep('review');
    } catch (error) {
      console.error('Error processing links:', error);
      alert('Failed to process links. Please try again.');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelection = (index: number) => {
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, isSelected: !r.isSelected } : r
      )
    );
  };

  const selectAll = () => {
    setResults(prev =>
      prev.map(r => ({ ...r, isSelected: r.status !== 'failed' }))
    );
  };

  const deselectAll = () => {
    setResults(prev => prev.map(r => ({ ...r, isSelected: false })));
  };

  const updateField = (index: number, field: 'editedName' | 'editedBrand' | 'editedDescription', value: string) => {
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const updatePhotoSelection = (index: number, photoIndex: number) => {
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, selectedPhotoIndex: photoIndex } : r
      )
    );
  };

  const handleSave = async () => {
    const selectedResults = results.filter(r => r.isSelected);
    if (selectedResults.length === 0) return;

    setIsSaving(true);

    try {
      const selections = selectedResults.map(r => ({
        resultIndex: r.index,
        item: {
          custom_name: r.editedName,
          brand: r.editedBrand,
          custom_description: r.editedDescription,
        },
        selectedPhotoUrl: r.photoOptions[r.selectedPhotoIndex]?.url || '',
        purchaseUrl: r.originalUrl,
      }));

      const response = await fetch(`/api/bags/${bagCode}/bulk-links/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections }),
      });

      if (!response.ok) {
        throw new Error('Failed to save items');
      }

      const data = await response.json();
      const successCount = data.createdItems?.length || 0;

      onItemsAdded(successCount);
      handleClose();
    } catch (error) {
      console.error('Error saving items:', error);
      alert('Failed to save items. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setParsedUrls([]);
    setResults([]);
    setSummary(null);
    setExpandedIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = results.filter(r => r.isSelected).length;
  const hasValidSelections = selectedCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              {step === 'input' && 'Import from Links'}
              {step === 'processing' && 'Analyzing Links...'}
              {step === 'review' && 'Review Items'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'input' && 'Paste product links to import (up to 25)'}
              {step === 'processing' && `Processing ${parsedUrls.length} links`}
              {step === 'review' && summary && (
                <>
                  {summary.successful} found, {summary.partial} partial, {summary.failed} failed
                  {' '}• {selectedCount} selected
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste product links (one per line or separated by commas)
                </label>
                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="https://amazon.com/dp/B08N5WRWNW&#10;https://golfgalaxy.com/product/...&#10;https://rei.com/product/..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {parsedUrls.length > 0 ? (
                    <span className="text-green-600 font-medium">
                      {parsedUrls.length} valid link{parsedUrls.length !== 1 ? 's' : ''} detected
                    </span>
                  ) : (
                    'No valid links detected'
                  )}
                  {parsedUrls.length >= 25 && (
                    <span className="text-orange-600 ml-2">(max 25)</span>
                  )}
                </div>
              </div>

              {parsedUrls.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Detected Links:</p>
                  <ul className="space-y-1">
                    {parsedUrls.map((url, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{url}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-[var(--sky-9)] animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Analyzing {parsedUrls.length} links</h3>
              <p className="text-sm text-gray-500 mt-2">
                Scraping pages, extracting product info, and finding photos...
              </p>
              <p className="text-xs text-gray-400 mt-4">
                This may take a minute for complete accuracy
              </p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Batch Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={selectAll}
                  className="text-[var(--sky-11)] hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Deselect All
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      result.status === 'failed'
                        ? 'border-red-200 bg-red-50'
                        : result.isSelected
                        ? 'border-[var(--teed-green-6)] bg-[var(--teed-green-1)]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(index)}
                          disabled={result.status === 'failed'}
                          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                            result.status === 'failed'
                              ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                              : result.isSelected
                              ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-9)]'
                              : 'border-gray-300 bg-white hover:border-[var(--teed-green-6)]'
                          }`}
                        >
                          {result.isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Photo Preview */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          {result.photoOptions.length > 0 ? (
                            <img
                              src={`/api/proxy-image?url=${encodeURIComponent(result.photoOptions[result.selectedPhotoIndex]?.url || result.photoOptions[0].url)}`}
                              alt={result.editedName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {result.editedName}
                            </h4>
                            {result.analysis && (
                              <ConfidenceBadge confidence={result.analysis.confidence} />
                            )}
                          </div>
                          {result.editedBrand && (
                            <p className="text-sm text-gray-600">{result.editedBrand}</p>
                          )}
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {result.scraped?.domain || new URL(result.originalUrl).hostname}
                          </p>
                          {result.status === 'failed' && result.error && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {result.error}
                            </p>
                          )}
                          {/* Warning for low-confidence Amazon results */}
                          {result.status !== 'failed' &&
                           result.analysis &&
                           result.analysis.confidence < 0.70 &&
                           (result.scraped?.domain?.includes('amazon') || result.originalUrl.includes('amazon')) && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Unable to verify Amazon product - please confirm name
                            </p>
                          )}
                        </div>

                        {/* Expand Button */}
                        {result.status !== 'failed' && (
                          <button
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            {expandedIndex === index ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedIndex === index && result.status !== 'failed' && (
                      <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-4">
                        {/* Photo Selection */}
                        {result.photoOptions.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                              Select Photo
                            </label>
                            <PhotoGrid
                              photoOptions={result.photoOptions}
                              selectedIndex={result.selectedPhotoIndex}
                              onSelect={(photoIndex) => updatePhotoSelection(index, photoIndex)}
                              itemName={result.editedName}
                            />
                          </div>
                        )}

                        {/* Editable Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                              Product Name
                            </label>
                            <input
                              type="text"
                              value={result.editedName}
                              onChange={(e) => updateField(index, 'editedName', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                              Brand
                            </label>
                            <input
                              type="text"
                              value={result.editedBrand}
                              onChange={(e) => updateField(index, 'editedBrand', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            Description / Specs
                          </label>
                          <input
                            type="text"
                            value={result.editedDescription}
                            onChange={(e) => updateField(index, 'editedDescription', e.target.value)}
                            placeholder="e.g., 10.5 Degree | Stiff Flex"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                          />
                        </div>

                        {/* Source Link */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ExternalLink className="w-3 h-3" />
                          <a
                            href={result.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--sky-11)] hover:underline truncate"
                          >
                            {result.originalUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing || isSaving}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>

            {step === 'input' && (
              <button
                onClick={handleAnalyze}
                disabled={parsedUrls.length === 0}
                className="flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Analyze {parsedUrls.length} Link{parsedUrls.length !== 1 ? 's' : ''}
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleSave}
                disabled={!hasValidSelections || isSaving}
                className="flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2 inline" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2 inline" />
                    Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''} to Bag
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
