'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Check, Loader2, Link as LinkIcon, ChevronDown, ChevronUp, ExternalLink, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { BulkLinkProcessingView } from './BulkLinkProcessingView';
import type {
  ProcessingStage,
  BulkLinkStreamEvent,
  StreamingItem,
  StreamedLinkResult,
} from '@/lib/types/bulkLinkStream';
import { STAGE_CONFIG } from '@/lib/types/bulkLinkStream';

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
  initialUrl?: string;
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BulkLinkImportModal({
  isOpen,
  onClose,
  bagCode,
  onItemsAdded,
  initialUrl,
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

  // Streaming state for progressive loading
  const [streamingResults, setStreamingResults] = useState<Map<number, StreamingItem>>(new Map());
  const [currentStages, setCurrentStages] = useState<Map<number, ProcessingStage>>(new Map());
  const [completedCount, setCompletedCount] = useState(0);

  const isSingleLinkMode = initialUrl !== undefined;
  const hasAutoStartedRef = useRef(false);

  // Auto-start analysis when initialUrl is provided
  useEffect(() => {
    if (isOpen && initialUrl && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      setParsedUrls([initialUrl]);
      // Defer to next tick so parsedUrls state is set before handleAnalyze reads it
      setTimeout(() => {
        setStep('processing');
        setIsProcessing(true);
        setProcessingProgress(0);
        setCompletedCount(0);

        const urls = [initialUrl];
        const initialItems = new Map<number, StreamingItem>();
        urls.forEach((url, i) => {
          initialItems.set(i, { status: 'pending', url });
        });
        setStreamingResults(initialItems);
        setCurrentStages(new Map());

        // Start the fetch inline
        (async () => {
          const collectedResults: StreamedLinkResult[] = [];
          try {
            const response = await fetch(`/api/bags/${bagCode}/bulk-links`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
              body: JSON.stringify({ urls }),
            });
            if (!response.ok) throw new Error('Failed to process links');
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');
            const decoder = new TextDecoder();
            let buffer = '';
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
                      const event: BulkLinkStreamEvent = JSON.parse(line.slice(6));
                      switch (event.type) {
                        case 'url_started':
                          setStreamingResults(prev => { const next = new Map(prev); next.set(event.index, { status: 'processing', url: event.url }); return next; });
                          break;
                        case 'url_stage_update':
                          setCurrentStages(prev => { const next = new Map(prev); next.set(event.index, event.stage); return next; });
                          break;
                        case 'url_completed':
                          collectedResults.push(event.result);
                          setStreamingResults(prev => { const next = new Map(prev); next.set(event.index, { status: 'completed', url: event.result.originalUrl, result: event.result }); return next; });
                          setCurrentStages(prev => { const next = new Map(prev); next.delete(event.index); return next; });
                          break;
                        case 'batch_progress':
                          setCompletedCount(event.completed);
                          setProcessingProgress((event.completed / event.total) * 100);
                          break;
                        case 'complete':
                          setSummary(event.summary);
                          break;
                        case 'error':
                          console.error('Stream error:', event.message);
                          break;
                      }
                    } catch (e) { console.error('Error parsing SSE event:', e); }
                  }
                }
              }
            }
            const resultsByIndex = new Map(collectedResults.map(r => [r.index, r]));
            const allResults: StreamedLinkResult[] = urls.map((url, index) => {
              const existing = resultsByIndex.get(index);
              if (existing) return existing;
              return { index, originalUrl: url, resolvedUrl: url, status: 'failed' as const, error: 'No response received from server', scraped: null, analysis: null, photoOptions: [], suggestedItem: { custom_name: 'Unknown Product', brand: '', custom_description: '' } };
            });
            const editedResults: EditedResult[] = allResults.sort((a, b) => a.index - b.index).map((r) => ({
              ...r, isSelected: r.status !== 'failed', editedName: r.suggestedItem.custom_name, editedBrand: r.suggestedItem.brand, editedDescription: r.suggestedItem.custom_description,
              selectedPhotoIndex: r.photoOptions.findIndex(p => p.isPrimary) >= 0 ? r.photoOptions.findIndex(p => p.isPrimary) : 0,
            }));
            setResults(editedResults);
            setStep('review');
          } catch (error) {
            console.error('Error processing links:', error);
            alert('Failed to process link. Please try again.');
            setStep('input');
          } finally {
            setIsProcessing(false);
          }
        })();
      }, 0);
    }
    if (!isOpen) {
      hasAutoStartedRef.current = false;
    }
  }, [isOpen, initialUrl, bagCode]);

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
    setCompletedCount(0);

    // Initialize streaming state with pending items
    const initialItems = new Map<number, StreamingItem>();
    parsedUrls.forEach((url, i) => {
      initialItems.set(i, { status: 'pending', url });
    });
    setStreamingResults(initialItems);
    setCurrentStages(new Map());

    const collectedResults: StreamedLinkResult[] = [];

    try {
      const response = await fetch(`/api/bags/${bagCode}/bulk-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ urls: parsedUrls }),
      });

      if (!response.ok) {
        throw new Error('Failed to process links');
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
                const event: BulkLinkStreamEvent = JSON.parse(line.slice(6));

                switch (event.type) {
                  case 'url_started':
                    setStreamingResults(prev => {
                      const next = new Map(prev);
                      next.set(event.index, {
                        status: 'processing',
                        url: event.url,
                      });
                      return next;
                    });
                    break;

                  case 'url_stage_update':
                    setCurrentStages(prev => {
                      const next = new Map(prev);
                      next.set(event.index, event.stage);
                      return next;
                    });
                    break;

                  case 'url_completed':
                    collectedResults.push(event.result);
                    setStreamingResults(prev => {
                      const next = new Map(prev);
                      next.set(event.index, {
                        status: 'completed',
                        url: event.result.originalUrl,
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
                    setProcessingProgress((event.completed / event.total) * 100);
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

      // Validate we got results for all URLs
      console.log(`[BulkLinkImport] Collected ${collectedResults.length} results for ${parsedUrls.length} URLs`);

      // Fill in any missing results (URLs that didn't get a response)
      const resultsByIndex = new Map(collectedResults.map(r => [r.index, r]));
      const allResults: StreamedLinkResult[] = parsedUrls.map((url, index) => {
        const existing = resultsByIndex.get(index);
        if (existing) return existing;

        // Create a failed result for missing URLs
        console.warn(`[BulkLinkImport] Missing result for URL at index ${index}: ${url}`);
        return {
          index,
          originalUrl: url,
          resolvedUrl: url,
          status: 'failed' as const,
          error: 'No response received from server',
          scraped: null,
          analysis: null,
          photoOptions: [],
          suggestedItem: { custom_name: 'Unknown Product', brand: '', custom_description: '' },
        };
      });

      // Convert collected results to editable format
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
        }));

      setResults(editedResults);
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
    // Reset streaming state
    setStreamingResults(new Map());
    setCurrentStages(new Map());
    setCompletedCount(0);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = results.filter(r => r.isSelected).length;
  const hasValidSelections = selectedCount > 0;

  // Get the current processing stage label for single-link pill
  const singleLinkStage = isSingleLinkMode ? currentStages.get(0) : undefined;
  const singleLinkDomain = (() => {
    if (!isSingleLinkMode || parsedUrls.length === 0) return '';
    try { return new URL(parsedUrls[0]).hostname.replace('www.', ''); } catch { return parsedUrls[0]; }
  })();

  // Single-link processing: show a compact floating pill instead of full modal
  if (isSingleLinkMode && step === 'processing') {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-lg border border-[var(--sky-5)] max-w-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--sky-11)] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {singleLinkStage ? STAGE_CONFIG[singleLinkStage].label : 'Identifying product'}...
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{singleLinkDomain}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

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
              <LinkIcon className="w-5 h-5" />
              {step === 'input' && (isSingleLinkMode ? 'Add from Link' : 'Import from Links')}
              {step === 'processing' && `Analyzing ${parsedUrls.length} Links...`}
              {step === 'review' && 'Review Items'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'input' && (isSingleLinkMode ? 'Paste a product link' : 'Paste product links to import (up to 25)')}
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {isSingleLinkMode ? (
                /* Single URL input for single-link mode */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product URL
                  </label>
                  <input
                    type="url"
                    value={inputText}
                    onChange={(e) => {
                      const text = e.target.value;
                      setInputText(text);
                      setParsedUrls(parseInput(text));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && parsedUrls.length > 0) {
                        e.preventDefault();
                        handleAnalyze();
                      }
                    }}
                    placeholder="https://amazon.com/dp/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent font-mono text-sm"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Paste a link from Amazon, REI, or any retailer
                  </p>
                </div>
              ) : (
                /* Multi-URL textarea for bulk mode */
                <>
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
                </>
              )}
            </div>
          )}

          {/* Step 2: Processing - Streaming View */}
          {step === 'processing' && (
            <BulkLinkProcessingView
              totalUrls={parsedUrls.length}
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

        {/* Footer - Stack on mobile, row on desktop */}
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
                onClick={handleAnalyze}
                disabled={parsedUrls.length === 0}
                className="w-full md:flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {parsedUrls.length === 1 ? 'Analyze Link' : `Analyze ${parsedUrls.length} Links`}
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
