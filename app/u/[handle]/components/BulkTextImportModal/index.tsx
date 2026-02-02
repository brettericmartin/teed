'use client';

import { useState, useCallback } from 'react';
import { X, Check, Loader2, FileText, ChevronDown, ChevronUp, Image as ImageIcon, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { TextProcessingView } from './TextProcessingView';
import { parseText, splitIntoItems, getParseDisplaySummary } from '@/lib/textParsing';
import type {
  TextProcessingStage,
  BulkTextStreamEvent,
  TextStreamingItem,
  ProcessedTextItem,
  TextBatchSummary,
} from '@/lib/types/bulkTextStream';

// ============================================================
// TYPES
// ============================================================

interface PhotoOption {
  url: string;
  source: 'suggestion' | 'search';
  isPrimary: boolean;
}

interface EditedResult extends ProcessedTextItem {
  isSelected: boolean;
  editedName: string;
  editedBrand: string;
  editedDescription: string;
  selectedPhotoIndex: number;
  // Refinement fields for re-identification
  refinementBrand: string;
  refinementColor: string;
  refinementDetails: string;
  isRefinementExpanded: boolean;
  isReidentifying: boolean;
}

interface BulkTextImportModalProps {
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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

// Parse preview component
function ParsePreview({ text }: { text: string }) {
  const parsed = parseText(text);
  const { mainText, badges } = getParseDisplaySummary(parsed);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-700 truncate max-w-[200px]">{mainText}</span>
      {badges.slice(0, 3).map((badge, idx) => (
        <span
          key={idx}
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            badge.type === 'brand' ? 'bg-gray-800 text-white' :
            badge.type === 'spec' ? 'bg-purple-100 text-purple-700' :
            badge.type === 'color' ? 'bg-blue-100 text-blue-700' :
            badge.type === 'size' ? 'bg-green-100 text-green-700' :
            badge.type === 'quantity' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'
          }`}
        >
          {badge.value}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BulkTextImportModal({
  isOpen,
  onClose,
  bagCode,
  onItemsAdded,
}: BulkTextImportModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<EditedResult[]>([]);
  const [summary, setSummary] = useState<TextBatchSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Streaming state for progressive loading
  const [streamingResults, setStreamingResults] = useState<Map<number, TextStreamingItem>>(new Map());
  const [currentStages, setCurrentStages] = useState<Map<number, TextProcessingStage>>(new Map());
  const [completedCount, setCompletedCount] = useState(0);

  // Parse text input into individual items
  const parseInput = useCallback((text: string) => {
    const items = splitIntoItems(text);
    return items.slice(0, 25); // Max 25 items
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setParsedItems(parseInput(text));
  };

  const handleProcess = async () => {
    if (parsedItems.length === 0) return;

    setStep('processing');
    setIsProcessing(true);
    setCompletedCount(0);

    // Initialize streaming state with pending items
    const initialItems = new Map<number, TextStreamingItem>();
    parsedItems.forEach((text, i) => {
      initialItems.set(i, { status: 'pending', rawText: text });
    });
    setStreamingResults(initialItems);
    setCurrentStages(new Map());

    const collectedResults: ProcessedTextItem[] = [];

    try {
      const response = await fetch(`/api/bulk-text/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ items: parsedItems, bagCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to process items');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (separated by double newlines)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventText of events) {
          if (!eventText.trim()) continue;

          // Parse SSE data lines
          const lines = eventText.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: BulkTextStreamEvent = JSON.parse(line.slice(6));

                switch (event.type) {
                  case 'item_started':
                    setStreamingResults(prev => {
                      const next = new Map(prev);
                      next.set(event.index, {
                        status: 'processing',
                        rawText: event.rawText,
                      });
                      return next;
                    });
                    break;

                  case 'item_stage_update':
                    setCurrentStages(prev => {
                      const next = new Map(prev);
                      next.set(event.index, event.stage);
                      return next;
                    });
                    break;

                  case 'item_completed':
                    collectedResults.push(event.result);
                    setStreamingResults(prev => {
                      const next = new Map(prev);
                      next.set(event.index, {
                        status: 'completed',
                        rawText: event.result.originalText,
                        result: event.result,
                      });
                      return next;
                    });
                    setCurrentStages(prev => {
                      const next = new Map(prev);
                      next.delete(event.index);
                      return next;
                    });
                    break;

                  case 'batch_progress':
                    setCompletedCount(event.completed);
                    break;

                  case 'complete':
                    setSummary(event.summary);
                    break;

                  case 'error':
                    console.error('Stream error:', event.message);
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e);
              }
            }
          }
        }
      }

      // Fill in any missing results
      const resultsByIndex = new Map(collectedResults.map(r => [r.index, r]));
      const allResults: ProcessedTextItem[] = parsedItems.map((text, index) => {
        const existing = resultsByIndex.get(index);
        if (existing) return existing;

        // Create a failed result for missing items
        return {
          index,
          originalText: text,
          status: 'failed' as const,
          error: 'No response received from server',
          parsed: parseText(text),
          suggestions: [],
          suggestedItem: { custom_name: text, brand: '', custom_description: '' },
          photoOptions: [],
          searchTier: 'error',
          confidence: 0,
        };
      });

      // Convert to editable format
      const editedResults: EditedResult[] = allResults
        .sort((a, b) => a.index - b.index)
        .map((r) => ({
          ...r,
          isSelected: r.status !== 'failed',
          editedName: r.suggestedItem.custom_name,
          editedBrand: r.suggestedItem.brand,
          editedDescription: r.suggestedItem.custom_description,
          selectedPhotoIndex: r.photoOptions.findIndex(p => p.isPrimary) >= 0
            ? r.photoOptions.findIndex(p => p.isPrimary)
            : 0,
          // Refinement fields - auto-expand if low confidence
          refinementBrand: '',
          refinementColor: '',
          refinementDetails: '',
          isRefinementExpanded: r.confidence < 0.75 && r.status !== 'failed',
          isReidentifying: false,
        }));

      setResults(editedResults);
      setStep('review');
    } catch (error) {
      console.error('Error processing items:', error);
      alert('Failed to process items. Please try again.');
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

  const updateRefinementField = (index: number, field: 'refinementBrand' | 'refinementColor' | 'refinementDetails', value: string) => {
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const toggleRefinement = (index: number) => {
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, isRefinementExpanded: !r.isRefinementExpanded } : r
      )
    );
  };

  const handleReidentify = async (index: number) => {
    const result = results[index];
    if (!result || result.isReidentifying) return;

    // Mark as re-identifying
    setResults(prev =>
      prev.map((r, i) =>
        i === index ? { ...r, isReidentifying: true } : r
      )
    );

    try {
      // Build enhanced query combining original text with refinement hints
      const parts: string[] = [];

      // Add brand first if provided (helps with correct identification)
      if (result.refinementBrand.trim()) {
        parts.push(result.refinementBrand.trim());
      }

      // Add original text
      parts.push(result.originalText);

      // Add color if provided
      if (result.refinementColor.trim()) {
        parts.push(result.refinementColor.trim());
      }

      // Add additional details
      if (result.refinementDetails.trim()) {
        parts.push(result.refinementDetails.trim());
      }

      const enhancedQuery = parts.join(' ');

      const response = await fetch('/api/ai/enrich-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: enhancedQuery,
          category: result.parsed?.inferredCategory || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Re-identification failed');
      }

      const data = await response.json();

      // Update result with new identification
      setResults(prev =>
        prev.map((r, i) => {
          if (i !== index) return r;

          // Build photo options from new suggestions
          const newPhotoOptions: PhotoOption[] = [];
          if (data.suggestions) {
            data.suggestions.forEach((s: { image_url?: string }) => {
              if (s.image_url) {
                newPhotoOptions.push({
                  url: s.image_url,
                  source: 'suggestion' as const,
                  isPrimary: newPhotoOptions.length === 0,
                });
              }
            });
          }
          if (data.searchImages) {
            data.searchImages.forEach((url: string) => {
              newPhotoOptions.push({
                url,
                source: 'search' as const,
                isPrimary: newPhotoOptions.length === 0,
              });
            });
          }

          return {
            ...r,
            isReidentifying: false,
            isRefinementExpanded: false, // Collapse after successful re-identification
            confidence: data.confidence || 0.85,
            editedName: data.enriched?.custom_name || r.editedName,
            editedBrand: data.enriched?.brand || r.editedBrand,
            editedDescription: data.enriched?.custom_description || r.editedDescription,
            photoOptions: newPhotoOptions.length > 0 ? newPhotoOptions : r.photoOptions,
            selectedPhotoIndex: 0,
            suggestions: data.suggestions || r.suggestions,
            // Clear refinement fields after use
            refinementBrand: '',
            refinementColor: '',
            refinementDetails: '',
          };
        })
      );
    } catch (error) {
      console.error('Re-identification failed:', error);
      // Just clear the loading state
      setResults(prev =>
        prev.map((r, i) =>
          i === index ? { ...r, isReidentifying: false } : r
        )
      );
    }
  };

  const handleSave = async () => {
    const selectedResults = results.filter(r => r.isSelected);
    if (selectedResults.length === 0) return;

    setIsSaving(true);

    try {
      const selections = selectedResults.map(r => ({
        item: {
          custom_name: r.editedName,
          brand: r.editedBrand,
          custom_description: r.editedDescription,
        },
        selectedPhotoUrl: r.photoOptions[r.selectedPhotoIndex]?.url || '',
      }));

      const response = await fetch(`/api/bags/${bagCode}/bulk-text/save`, {
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
    setParsedItems([]);
    setResults([]);
    setSummary(null);
    setExpandedIndex(null);
    setStreamingResults(new Map());
    setCurrentStages(new Map());
    setCompletedCount(0);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = results.filter(r => r.isSelected).length;
  const hasValidSelections = selectedCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Modal - Full-screen on mobile, centered card on desktop */}
      <div className="
        fixed inset-0
        flex flex-col bg-white
        md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
        md:max-w-4xl md:w-full md:max-h-[90vh] md:rounded-xl
        overflow-hidden md:shadow-xl
      ">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {step === 'input' && 'Import from Text'}
              {step === 'processing' && 'Identifying Items...'}
              {step === 'review' && 'Review Items'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'input' && 'Enter item descriptions to import (up to 25)'}
              {step === 'processing' && `Processing ${parsedItems.length} items`}
              {step === 'review' && summary && (
                <>
                  {summary.successful} identified, {summary.partial} partial, {summary.failed} failed
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter items (one per line, comma-separated, or as a list)
                </label>
                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="TaylorMade Qi10 Max Driver 10.5 stiff&#10;Nike Air Max 90 size 10&#10;Lululemon ABC Jogger black L&#10;2x wireless earbuds under $50"
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent resize-none text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {parsedItems.length > 0 ? (
                    <span className="text-green-600 font-medium">
                      {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} detected
                    </span>
                  ) : (
                    'No items detected'
                  )}
                  {parsedItems.length >= 25 && (
                    <span className="text-orange-600 ml-2">(max 25)</span>
                  )}
                </div>
              </div>

              {parsedItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Preview (parsed components):</p>
                  <ul className="space-y-2">
                    {parsedItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <ParsePreview text={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Processing - Streaming View */}
          {step === 'processing' && (
            <TextProcessingView
              totalItems={parsedItems.length}
              completedCount={completedCount}
              streamingResults={streamingResults}
              currentStages={currentStages}
            />
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
                            <ConfidenceBadge confidence={result.confidence} />
                          </div>
                          {result.editedBrand && (
                            <p className="text-sm text-gray-600">{result.editedBrand}</p>
                          )}
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {result.originalText}
                          </p>
                          {result.status === 'failed' && result.error && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {result.error}
                            </p>
                          )}
                        </div>

                        {/* Expand Button for details */}
                        {result.status !== 'failed' && (
                          <button
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Edit details"
                          >
                            {expandedIndex === index ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Refinement Section - auto-expanded for low confidence */}
                      {result.status !== 'failed' && (
                        <div className="mt-3">
                          {result.isRefinementExpanded ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-amber-800 font-medium">
                                  Help improve this identification
                                </p>
                                <button
                                  onClick={() => toggleRefinement(index)}
                                  className="text-xs text-amber-600 hover:text-amber-800"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Brand
                                  </label>
                                  <input
                                    type="text"
                                    value={result.refinementBrand}
                                    onChange={(e) => updateRefinementField(index, 'refinementBrand', e.target.value)}
                                    placeholder="e.g., Nike, TaylorMade"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="text"
                                    value={result.refinementColor}
                                    onChange={(e) => updateRefinementField(index, 'refinementColor', e.target.value)}
                                    placeholder="e.g., black, navy blue"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  More details
                                </label>
                                <input
                                  type="text"
                                  value={result.refinementDetails}
                                  onChange={(e) => updateRefinementField(index, 'refinementDetails', e.target.value)}
                                  placeholder="e.g., waffle, 2024, titanium, from their golf line"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <button
                                onClick={() => handleReidentify(index)}
                                disabled={result.isReidentifying || (!result.refinementBrand && !result.refinementColor && !result.refinementDetails)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {result.isReidentifying ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Re-identifying...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4" />
                                    Re-identify
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleRefinement(index)}
                              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              <Plus className="w-4 h-4" />
                              Add details to improve match
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded Content - Photo & Edit Fields */}
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

                        {/* Parsed Info */}
                        {result.parsed && (result.parsed.specifications.length > 0 || result.parsed.color || result.parsed.size) && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Detected: </span>
                            {result.parsed.specifications.map(s => s.value).join(', ')}
                            {result.parsed.color && `, ${result.parsed.color}`}
                            {result.parsed.size && `, Size ${result.parsed.size.value}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 md:p-6 bg-gray-50 safe-area-inset-bottom">
          <div className="flex flex-col-reverse gap-2 md:flex-row md:gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing || isSaving}
              className="w-full md:w-auto px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>

            {step === 'input' && (
              <button
                onClick={handleProcess}
                disabled={parsedItems.length === 0}
                className="w-full md:flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Identify {parsedItems.length} Item{parsedItems.length !== 1 ? 's' : ''}
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleSave}
                disabled={!hasValidSelections || isSaving}
                className="w-full md:flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
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
