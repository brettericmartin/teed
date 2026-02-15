'use client';

import { useState } from 'react';
import { X, Check, Loader2, Type, ChevronDown, ChevronUp, ExternalLink, AlertCircle, Image as ImageIcon, Plus, Trash2, Sparkles, ArrowLeft } from 'lucide-react';
import { BulkTextProcessingView } from './BulkTextProcessingView';
import BulkTextValidateView from './BulkTextValidateView';
import type { ValidateItem } from './BulkTextValidateView';
import type {
  TextProcessingStage,
  BulkTextStreamEvent,
  TextStreamingItem,
  ProcessedTextItem,
  TextBatchSummary,
  StructuredTextInput,
  ValidatedItemInput,
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
}

interface BulkTextAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  onItemsAdded: (count: number) => void;
}

type Step = 'input' | 'identifying' | 'validate' | 'review';

interface InputRow {
  id: string;
  brand: string;
  productName: string;
  color: string;
}

function createEmptyRow(): InputRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    brand: '',
    productName: '',
    color: '',
  };
}

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

// ============================================================
// SSE READER (shared between identify & enhance passes)
// ============================================================

interface SSEReaderCallbacks {
  onItemStarted: (index: number, rawText: string) => void;
  onStageUpdate: (index: number, stage: TextProcessingStage) => void;
  onItemCompleted: (index: number, result: ProcessedTextItem) => void;
  onBatchProgress: (completed: number) => void;
  onComplete: (summary: TextBatchSummary) => void;
  onError: (message: string) => void;
}

async function readSSEStream(response: Response, callbacks: SSEReaderCallbacks): Promise<ProcessedTextItem[]> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  const collectedResults: ProcessedTextItem[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventText of events) {
      if (!eventText.trim()) continue;
      const lines = eventText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: BulkTextStreamEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'item_started':
                callbacks.onItemStarted(event.index, event.rawText);
                break;
              case 'item_stage_update':
                callbacks.onStageUpdate(event.index, event.stage);
                break;
              case 'item_completed':
                collectedResults.push(event.result);
                callbacks.onItemCompleted(event.index, event.result);
                break;
              case 'batch_progress':
                callbacks.onBatchProgress(event.completed);
                break;
              case 'complete':
                callbacks.onComplete(event.summary);
                break;
              case 'error':
                callbacks.onError(event.message);
                break;
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    }
  }

  return collectedResults;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BulkTextAddModal({
  isOpen,
  onClose,
  bagCode,
  onItemsAdded,
}: BulkTextAddModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [rows, setRows] = useState<InputRow[]>(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState<'identify' | 'enhance'>('identify');

  // Identify pass results → feed into validate step
  const [identifiedResults, setIdentifiedResults] = useState<ProcessedTextItem[]>([]);
  // Validate step state
  const [validateItems, setValidateItems] = useState<ValidateItem[]>([]);
  // Enhanced results → feed into review step
  const [results, setResults] = useState<EditedResult[]>([]);

  const [summary, setSummary] = useState<TextBatchSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Streaming state (shared between identify and enhance passes)
  const [streamingResults, setStreamingResults] = useState<Map<number, TextStreamingItem>>(new Map());
  const [currentStages, setCurrentStages] = useState<Map<number, TextProcessingStage>>(new Map());
  const [completedCount, setCompletedCount] = useState(0);

  // ============================================================
  // INPUT STEP HANDLERS
  // ============================================================

  const updateRow = (id: string, field: keyof Omit<InputRow, 'id'>, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRow = (id: string) => {
    setRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(r => r.id !== id);
    });
  };

  const addRow = () => {
    if (rows.length >= 25) return;
    setRows(prev => [...prev, createEmptyRow()]);
  };

  const validRows = rows.filter(r => r.productName.trim().length > 0);

  // ============================================================
  // IDENTIFY PASS (Step 2: input → identifying → validate)
  // ============================================================

  const handleIdentify = async () => {
    if (validRows.length === 0) return;

    setStep('identifying');
    setProcessingMode('identify');
    setIsProcessing(true);
    setCompletedCount(0);

    const structuredItems: StructuredTextInput[] = validRows.map(r => ({
      brand: r.brand.trim() || undefined,
      productName: r.productName.trim(),
      color: r.color.trim() || undefined,
    }));

    const textItems = validRows.map(r =>
      [r.brand, r.productName, r.color].filter(Boolean).join(' ').trim()
    );

    // Initialize streaming state
    const initialItems = new Map<number, TextStreamingItem>();
    textItems.forEach((text, i) => {
      initialItems.set(i, { status: 'pending', rawText: text });
    });
    setStreamingResults(initialItems);
    setCurrentStages(new Map());

    try {
      const response = await fetch('/api/bulk-text/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          structuredItems,
          items: textItems,
          bagCode,
          mode: 'identify',
        }),
      });

      if (!response.ok) throw new Error('Failed to identify items');

      const collectedResults = await readSSEStream(response, {
        onItemStarted: (index, rawText) => {
          setStreamingResults(prev => {
            const next = new Map(prev);
            next.set(index, { status: 'processing', rawText });
            return next;
          });
        },
        onStageUpdate: (index, stage) => {
          setCurrentStages(prev => {
            const next = new Map(prev);
            next.set(index, stage);
            return next;
          });
        },
        onItemCompleted: (index, result) => {
          setStreamingResults(prev => {
            const next = new Map(prev);
            next.set(index, { status: 'completed', rawText: result.originalText, result });
            return next;
          });
          setCurrentStages(prev => {
            const next = new Map(prev);
            next.delete(index);
            return next;
          });
        },
        onBatchProgress: (completed) => setCompletedCount(completed),
        onComplete: (s) => setSummary(s),
        onError: (msg) => console.error('Stream error:', msg),
      });

      // Fill in missing results
      const resultsByIndex = new Map(collectedResults.map(r => [r.index, r]));
      const allResults: ProcessedTextItem[] = textItems.map((text, index) => {
        const existing = resultsByIndex.get(index);
        if (existing) return existing;
        return {
          index,
          originalText: text,
          status: 'failed',
          error: 'No response received',
          parsed: {} as ProcessedTextItem['parsed'],
          suggestions: [],
          suggestedItem: { custom_name: text, brand: '', custom_description: '' },
          photoOptions: [],
          searchTier: 'error',
          confidence: 0,
        } as ProcessedTextItem;
      });

      setIdentifiedResults(allResults);

      // Build validate items with auto-confirm logic
      const vItems: ValidateItem[] = allResults
        .sort((a, b) => a.index - b.index)
        .map(r => ({
          result: r,
          // Auto-select: >= 0.70 confidence
          isSelected: r.status !== 'failed' && r.confidence >= 0.70,
          confirmedName: r.suggestedItem.custom_name,
          confirmedBrand: r.suggestedItem.brand,
          confirmedDescription: r.suggestedItem.custom_description,
          confirmedCategory: r.suggestions[0]?.category || '',
        }));

      setValidateItems(vItems);
      setStep('validate');
    } catch (error) {
      console.error('Error identifying items:', error);
      alert('Failed to identify items. Please try again.');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // ENHANCE PASS (Step 3: validate → processing → review)
  // ============================================================

  const handleEnhance = async () => {
    const selected = validateItems.filter(v => v.isSelected);
    if (selected.length === 0) return;

    // Build ValidatedItemInput array from user-confirmed data
    const confirmedItems: ValidatedItemInput[] = selected.map((v, i) => ({
      index: i,
      name: v.confirmedName,
      brand: v.confirmedBrand,
      description: v.confirmedDescription,
      category: v.confirmedCategory,
    }));

    setStep('identifying'); // reuse processing view
    setProcessingMode('enhance');
    setIsProcessing(true);
    setCompletedCount(0);

    // Initialize streaming state for enhance pass
    const initialItems = new Map<number, TextStreamingItem>();
    confirmedItems.forEach((item, i) => {
      const displayName = item.brand ? `${item.brand} ${item.name}` : item.name;
      initialItems.set(i, { status: 'pending', rawText: displayName });
    });
    setStreamingResults(initialItems);
    setCurrentStages(new Map());

    try {
      const response = await fetch('/api/bulk-text/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          confirmedItems,
          bagCode,
          mode: 'enhance',
        }),
      });

      if (!response.ok) throw new Error('Failed to enhance items');

      const collectedResults = await readSSEStream(response, {
        onItemStarted: (index, rawText) => {
          setStreamingResults(prev => {
            const next = new Map(prev);
            next.set(index, { status: 'processing', rawText });
            return next;
          });
        },
        onStageUpdate: (index, stage) => {
          setCurrentStages(prev => {
            const next = new Map(prev);
            next.set(index, stage);
            return next;
          });
        },
        onItemCompleted: (index, result) => {
          setStreamingResults(prev => {
            const next = new Map(prev);
            next.set(index, { status: 'completed', rawText: result.originalText, result });
            return next;
          });
          setCurrentStages(prev => {
            const next = new Map(prev);
            next.delete(index);
            return next;
          });
        },
        onBatchProgress: (completed) => setCompletedCount(completed),
        onComplete: (s) => setSummary(s),
        onError: (msg) => console.error('Stream error:', msg),
      });

      // Fill in missing
      const resultsByIndex = new Map(collectedResults.map(r => [r.index, r]));
      const allEnhanced: ProcessedTextItem[] = confirmedItems.map((item, index) => {
        const existing = resultsByIndex.get(index);
        if (existing) return existing;
        const displayName = item.brand ? `${item.brand} ${item.name}` : item.name;
        return {
          index,
          originalText: displayName,
          status: 'failed',
          error: 'No response received',
          parsed: {} as ProcessedTextItem['parsed'],
          suggestions: [],
          suggestedItem: { custom_name: item.name, brand: item.brand, custom_description: item.description || '' },
          photoOptions: [],
          searchTier: 'error',
          confidence: 1.0,
        } as ProcessedTextItem;
      });

      // Convert to editable results for the review step
      const editedResults: EditedResult[] = allEnhanced
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
        }));

      setResults(editedResults);
      setStep('review');
    } catch (error) {
      console.error('Error enhancing items:', error);
      alert('Failed to enhance items. Please try again.');
      setStep('validate');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // REVIEW STEP HANDLERS
  // ============================================================

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

  // ============================================================
  // SAVE
  // ============================================================

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
        purchaseUrl: r.linkUrl,
        purchaseLabel: r.linkLabel,
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

  // ============================================================
  // CLOSE / RESET
  // ============================================================

  const handleClose = () => {
    setStep('input');
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setIdentifiedResults([]);
    setValidateItems([]);
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
  const validateSelectedCount = validateItems.filter(v => v.isSelected).length;
  const totalStreamingItems = streamingResults.size;

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
              <Type className="w-5 h-5" />
              {step === 'input' && 'Bulk Add from Text'}
              {step === 'identifying' && processingMode === 'identify' && `Identifying ${validRows.length} Items...`}
              {step === 'identifying' && processingMode === 'enhance' && `Enhancing ${validateSelectedCount} Items...`}
              {step === 'validate' && 'Confirm Identified Items'}
              {step === 'review' && 'Review Items'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'input' && 'Enter brand, product name, and color for each item'}
              {step === 'identifying' && processingMode === 'identify' && `Parsing, searching, and identifying ${validRows.length} items`}
              {step === 'identifying' && processingMode === 'enhance' && `Finding links and photos for ${validateSelectedCount} items`}
              {step === 'validate' && 'Review AI identifications before finding links and photos'}
              {step === 'review' && summary && (
                <>
                  {summary.successful} found, {summary.partial} partial, {summary.failed} failed
                  {' '}&bull; {selectedCount} selected
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
            <div className="space-y-3">
              {/* Column Headers (desktop) */}
              <div className="hidden md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,2.5fr)_40px] gap-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase">Brand</span>
                <span className="text-xs font-medium text-gray-500 uppercase">Product Name *</span>
                <span className="text-xs font-medium text-gray-500 uppercase">Color</span>
                <span />
              </div>

              {/* Rows */}
              {rows.map((row, index) => (
                <div key={row.id} className="group">
                  {/* Desktop: single row */}
                  <div className="hidden md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,2.5fr)_40px] gap-2">
                    <input
                      type="text"
                      value={row.brand}
                      onChange={(e) => updateRow(row.id, 'brand', e.target.value)}
                      placeholder="Brand"
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={row.productName}
                      onChange={(e) => updateRow(row.id, 'productName', e.target.value)}
                      placeholder="Product name *"
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && validRows.length > 0) {
                          e.preventDefault();
                          handleIdentify();
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={row.color}
                      onChange={(e) => updateRow(row.id, 'color', e.target.value)}
                      placeholder="Color"
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                    />
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile: stacked layout */}
                  <div className="md:hidden space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={row.brand}
                      onChange={(e) => updateRow(row.id, 'brand', e.target.value)}
                      placeholder="Brand"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={row.productName}
                        onChange={(e) => updateRow(row.id, 'productName', e.target.value)}
                        placeholder="Product name *"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={row.color}
                        onChange={(e) => updateRow(row.id, 'color', e.target.value)}
                        placeholder="Color"
                        className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Row Button */}
              {rows.length < 25 && (
                <button
                  onClick={addRow}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--sky-11)] hover:bg-[var(--sky-2)] rounded-lg transition-colors w-full justify-center border border-dashed border-[var(--sky-5)]"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              )}

              {/* Info Note */}
              <p className="text-xs text-gray-500 text-center mt-2">
                {validRows.length > 0 ? (
                  <span className="text-green-600 font-medium">
                    {validRows.length} item{validRows.length !== 1 ? 's' : ''} ready
                  </span>
                ) : (
                  'Enter at least one product name to continue'
                )}
                {rows.length >= 25 && (
                  <span className="text-orange-600 ml-2">(max 25)</span>
                )}
              </p>
            </div>
          )}

          {/* Step 2/3b: Processing - Streaming View (used for both identify and enhance) */}
          {step === 'identifying' && (
            <BulkTextProcessingView
              totalItems={totalStreamingItems}
              completedCount={completedCount}
              streamingResults={streamingResults}
              currentStages={currentStages}
              mode={processingMode}
            />
          )}

          {/* Step 3: Validate */}
          {step === 'validate' && (
            <BulkTextValidateView
              items={validateItems}
              onItemsChange={setValidateItems}
              onEnhance={handleEnhance}
            />
          )}

          {/* Step 4: Review */}
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
                          {/* Purchase Link Badge */}
                          {result.linkUrl && (
                            <a
                              href={result.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--sky-11)] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {(() => {
                                try { return new URL(result.linkUrl).hostname.replace('www.', ''); } catch { return 'Link'; }
                              })()}
                            </a>
                          )}
                          {result.status === 'failed' && result.error && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {result.error}
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

                        {/* Enhance Note */}
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Use Enhance Details after adding for richer info
                        </p>
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
            {/* Left button: Cancel or Back */}
            {step === 'validate' ? (
              <button
                onClick={() => setStep('input')}
                className="w-full md:w-auto px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Input
              </button>
            ) : (
              <button
                onClick={handleClose}
                disabled={isProcessing || isSaving}
                className="w-full md:w-auto px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
            )}

            {step === 'input' && (
              <button
                onClick={handleIdentify}
                disabled={validRows.length === 0}
                className="w-full md:flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Identify {validRows.length > 0 ? `${validRows.length} Item${validRows.length !== 1 ? 's' : ''}` : 'All'}
              </button>
            )}

            {step === 'validate' && (
              <button
                onClick={handleEnhance}
                disabled={validateSelectedCount === 0}
                className="w-full md:flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Enhance {validateSelectedCount} Item{validateSelectedCount !== 1 ? 's' : ''}
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
