'use client';

import { useState, useCallback, useEffect } from 'react';
import { Link2, X, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useEditMode } from '../EditModeProvider';
import {
  classifyUrls,
  parseUrlsFromInput,
  type LinkClassification,
  type ClassificationResult,
} from '@/lib/links/classifyUrl';
import type {
  UniversalLinkStep,
  ProcessedEmbed,
  ProcessedSocial,
  ProcessedProduct,
  ReviewTab,
  BagOption,
} from '@/lib/types/universalLink';
import { DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';
import LinkInputStep from './LinkInputStep';
import ProcessingStep from './ProcessingStep';
import ReviewStep from './ReviewStep';
import DestinationStep from './DestinationStep';

interface UniversalLinkAdderProps {
  profileId: string;
  onUpdateProfile: (updates: { social_links?: Record<string, string> }) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  /** Pre-loaded bags from parent - avoids extra API fetch */
  bags?: BagOption[];
}

export default function UniversalLinkAdder({
  profileId,
  onUpdateProfile,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  bags: propBags,
}: UniversalLinkAdderProps) {
  // Determine if externally controlled (by ProfileHub)
  const isExternallyControlled = externalOnClose !== undefined;

  const { isEditMode, addBlock } = useEditMode();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Internal state for legacy standalone usage
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [step, setStep] = useState<UniversalLinkStep>('input');

  // Input state
  const [inputText, setInputText] = useState('');
  const [parsedUrls, setParsedUrls] = useState<string[]>([]);

  // Classification results
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);

  // Processed items (after SSE processing for products)
  const [embeds, setEmbeds] = useState<ProcessedEmbed[]>([]);
  const [socials, setSocials] = useState<ProcessedSocial[]>([]);
  const [products, setProducts] = useState<ProcessedProduct[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ completed: 0, total: 0 });

  // Destination state
  const [selectedBagCode, setSelectedBagCode] = useState<string | null>(null);
  const [newBagTitle, setNewBagTitle] = useState('');
  const [userBags, setUserBags] = useState<BagOption[]>([]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Derived state - must be after all useState but before useEffect
  const isOpen = isExternallyControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = useCallback((value: boolean) => {
    if (isExternallyControlled) {
      if (!value && externalOnClose) externalOnClose();
    } else {
      setInternalIsOpen(value);
    }
  }, [isExternallyControlled, externalOnClose]);

  // Parse URLs when input changes
  useEffect(() => {
    const urls = parseUrlsFromInput(inputText, 25);
    setParsedUrls(urls);
  }, [inputText]);

  // Fetch user's bags - wrapped in useCallback for stable reference
  const fetchUserBags = useCallback(async () => {
    console.log('fetchUserBags called');
    try {
      const response = await fetch('/api/user/bags');
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch bags:', data.error);
        return;
      }

      const bags = data.bags || [];
      console.log('Fetched bags for destination:', bags);
      setUserBags(
        bags.map((bag: any) => ({
          id: bag.id,
          code: bag.code,
          title: bag.title,
          itemCount: bag.item_count || 0,
          updatedAt: bag.updated_at || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('Failed to fetch bags:', error);
    }
  }, []);

  // Initialize bags from props or fetch when modal opens
  useEffect(() => {
    console.log('UniversalLinkAdder useEffect - isOpen:', isOpen, 'propBags:', propBags?.length);
    if (isOpen) {
      if (propBags && propBags.length > 0) {
        // Use bags passed from parent (already loaded in UnifiedProfileView)
        console.log('Using bags from props:', propBags.length);
        setUserBags(propBags);
      } else {
        // Fallback: fetch from API if no bags prop provided
        console.log('Fetching user bags from API...');
        fetchUserBags();
      }
    }
  }, [isOpen, propBags, fetchUserBags]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('input');
      setInputText('');
      setParsedUrls([]);
      setClassifications([]);
      setEmbeds([]);
      setSocials([]);
      setProducts([]);
      setIsProcessing(false);
      setProcessingProgress({ completed: 0, total: 0 });
      setSelectedBagCode(null);
      setNewBagTitle('');
      setSaveError(null);
    }, 300);
  }, []);

  // Analyze links - classify and start processing
  const handleAnalyze = useCallback(async () => {
    if (parsedUrls.length === 0) return;

    setStep('processing');
    setIsProcessing(true);

    // Classify URLs instantly (no network)
    const { results, summary } = classifyUrls(parsedUrls);
    setClassifications(results);

    // Separate by type
    const embedResults: ProcessedEmbed[] = [];
    const socialResults: ProcessedSocial[] = [];
    const productUrls: { index: number; url: string }[] = [];

    results.forEach((result, i) => {
      switch (result.classification.type) {
        case 'embed':
          embedResults.push({
            index: i,
            url: result.originalUrl,
            platform: result.classification.platform,
            title: '',
            selected: true,
          });
          break;
        case 'social':
          socialResults.push({
            index: i,
            url: result.originalUrl,
            platform: result.classification.platform,
            username: result.classification.username,
            displayName: result.classification.displayName,
            selected: true,
          });
          break;
        case 'product':
          productUrls.push({ index: i, url: result.originalUrl });
          break;
      }
    });

    setEmbeds(embedResults);
    setSocials(socialResults);
    setProcessingProgress({ completed: 0, total: productUrls.length });

    // If no products, skip to review
    if (productUrls.length === 0) {
      setIsProcessing(false);
      setStep('review');
      return;
    }

    // Process products via SSE
    try {
      const response = await fetch('/api/universal-links/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: productUrls.map((p) => p.url),
          profileId,
        }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      const processedProducts: ProcessedProduct[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'product_completed') {
                processedProducts.push({
                  ...event.result,
                  index: productUrls[event.index].index,
                  selected: event.result.status !== 'failed',
                });
                setProducts([...processedProducts]);
                setProcessingProgress((prev) => ({
                  ...prev,
                  completed: processedProducts.length,
                }));
              } else if (event.type === 'complete') {
                // Processing done
                setIsProcessing(false);
                setStep('review');
              } else if (event.type === 'error') {
                console.error('Processing error:', event.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      setIsProcessing(false);
      setStep('review');
    } catch (error) {
      console.error('Product processing failed:', error);
      // Even on error, move to review with what we have
      setIsProcessing(false);
      setStep('review');
    }
  }, [parsedUrls, profileId]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const selectedEmbeds = embeds.filter((e) => e.selected);
      const selectedSocials = socials.filter((s) => s.selected);
      const selectedProducts = products.filter((p) => p.selected);

      // Build the save request
      const saveRequest: import('@/lib/types/universalLink').UniversalLinkSaveRequest = {
        profileId,
        embeds: selectedEmbeds.map((e) => ({
          url: e.url,
          platform: e.platform,
          title: e.title || undefined,
        })),
        socialLinks: selectedSocials.reduce((acc, s) => {
          acc[s.platform] = s.url;
          return acc;
        }, {} as Record<string, string>),
        products: selectedProducts.length > 0 && selectedBagCode ? {
          bagCode: selectedBagCode,
          newBagTitle: selectedBagCode === 'new' ? newBagTitle : undefined,
          selections: selectedProducts.map((p) => ({
            index: p.index,
            purchaseUrl: p.url,
            item: {
              custom_name: p.productName,
              custom_description: p.description,
              brand: p.brand,
            },
            selectedPhotoUrl: p.photos[p.selectedPhotoIndex]?.url || '',
          })),
        } : null,
      };

      // Call the unified save API
      const response = await fetch('/api/universal-links/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const result: import('@/lib/types/universalLink').UniversalLinkSaveResponse = await response.json();

      if (result.errors.length > 0) {
        console.warn('Save completed with errors:', result.errors);
      }

      // Also add blocks locally for immediate UI update
      const embedGridDefaults = DEFAULT_BLOCK_GRID.embed;
      for (const embed of selectedEmbeds) {
        addBlock({
          profile_id: profileId,
          block_type: 'embed',
          sort_order: 0,
          is_visible: true,
          width: 'full',
          gridX: 0,
          gridY: 0,
          gridW: embedGridDefaults.w,
          gridH: embedGridDefaults.h,
          config: {
            platform: embed.platform,
            url: embed.url,
            title: embed.title || undefined,
          },
        });
      }

      // Success - close modal
      handleClose();
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [
    embeds,
    socials,
    products,
    selectedBagCode,
    newBagTitle,
    profileId,
    addBlock,
    handleClose,
  ]);

  // Check if we need destination step
  const needsDestination = products.filter((p) => p.selected).length > 0;

  // Navigation
  const handleNext = useCallback(() => {
    if (step === 'review' && needsDestination) {
      setStep('destination');
    } else {
      handleSave();
    }
  }, [step, needsDestination, handleSave]);

  const handleBack = useCallback(() => {
    if (step === 'destination') {
      setStep('review');
    } else if (step === 'review') {
      setStep('input');
    }
  }, [step]);

  // Calculate counts for display
  const selectedEmbedCount = embeds.filter((e) => e.selected).length;
  const selectedSocialCount = socials.filter((s) => s.selected).length;
  const selectedProductCount = products.filter((p) => p.selected).length;
  const totalSelected = selectedEmbedCount + selectedSocialCount + selectedProductCount;

  // Early returns AFTER all hooks
  // When externally controlled, only render when explicitly opened
  if (isExternallyControlled && !externalIsOpen) {
    return null;
  }

  // For standalone mode, only render in edit mode
  if (!isExternallyControlled && !isEditMode) {
    return null;
  }

  return (
    <>
      {/* FAB Button - Only shown in standalone mode (not externally controlled) */}
      {!isExternallyControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="
            fixed bottom-24 right-6 z-[100]
            flex items-center gap-2 px-5 py-3 rounded-full
            bg-[var(--theme-primary,var(--teed-green-9))] text-white
            shadow-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
            hover:scale-105 active:scale-95
            transition-all duration-200
          "
        >
          <Link2 className="w-5 h-5" />
          <span className="font-semibold text-sm">Add Links</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={handleClose}
          />

          {/* Modal Content - Full-screen on mobile, centered card on desktop */}
          <div className="
            fixed inset-0 z-[201]
            flex flex-col bg-[var(--surface)]
            sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            sm:max-w-lg sm:w-[calc(100%-2rem)] sm:max-h-[85vh] sm:rounded-2xl
            overflow-hidden sm:shadow-2xl
          ">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {step === 'input' && 'Add Links'}
                  {step === 'processing' && 'Analyzing...'}
                  {step === 'review' && 'Review Links'}
                  {step === 'destination' && 'Choose Destination'}
                </h2>
                {step === 'input' && (
                  <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-0.5">
                    Paste links - products, videos, or social profiles
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {step === 'input' && (
                <LinkInputStep
                  inputText={inputText}
                  onInputChange={setInputText}
                  parsedUrls={parsedUrls}
                />
              )}

              {step === 'processing' && (
                <ProcessingStep
                  classifications={classifications}
                  embedCount={embeds.length}
                  socialCount={socials.length}
                  productProgress={processingProgress}
                  isProcessing={isProcessing}
                />
              )}

              {step === 'review' && (
                <ReviewStep
                  embeds={embeds}
                  social={socials}
                  products={products}
                  onToggleEmbed={(index) => {
                    setEmbeds(prev => prev.map(e =>
                      e.index === index ? { ...e, selected: !e.selected } : e
                    ));
                  }}
                  onToggleSocial={(index) => {
                    setSocials(prev => prev.map(s =>
                      s.index === index ? { ...s, selected: !s.selected } : s
                    ));
                  }}
                  onToggleProduct={(index) => {
                    setProducts(prev => prev.map(p =>
                      p.index === index ? { ...p, selected: !p.selected } : p
                    ));
                  }}
                  onUpdateProduct={(index, updates) => {
                    setProducts(prev => prev.map(p =>
                      p.index === index ? { ...p, ...updates } : p
                    ));
                  }}
                  onChangeProductPhoto={(productIndex, photoIndex) => {
                    setProducts(prev => prev.map(p =>
                      p.index === productIndex ? { ...p, selectedPhotoIndex: photoIndex } : p
                    ));
                  }}
                />
              )}

              {step === 'destination' && (
                <DestinationStep
                  bags={userBags}
                  selectedBagCode={selectedBagCode}
                  onSelectBag={setSelectedBagCode}
                  newBagTitle={newBagTitle}
                  onNewBagTitleChange={setNewBagTitle}
                  embedCount={selectedEmbedCount}
                  socialCount={selectedSocialCount}
                  productCount={selectedProductCount}
                  isLoading={isSaving}
                />
              )}
            </div>

            {/* Footer - Stacks on mobile, side-by-side on desktop */}
            <div className="flex-shrink-0 px-3 py-3 sm:px-4 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] safe-area-inset-bottom">
              {/* Status text - hidden on mobile to save space, shown on sm+ */}
              <div className="hidden sm:block text-sm text-[var(--text-tertiary)] mb-3">
                {step === 'input' && parsedUrls.length > 0 && (
                  <span>{parsedUrls.length} link{parsedUrls.length !== 1 ? 's' : ''} detected</span>
                )}
                {step === 'review' && totalSelected > 0 && (
                  <span>{totalSelected} selected</span>
                )}
                {step === 'destination' && (
                  <span>{selectedProductCount} product{selectedProductCount !== 1 ? 's' : ''} → {selectedBagCode === 'new' ? 'New Bag' : userBags.find(b => b.code === selectedBagCode)?.title || 'Select bag'}</span>
                )}
                {saveError && (
                  <span className="text-red-500">{saveError}</span>
                )}
              </div>

              {/* Buttons - stack vertically on mobile (reverse order for primary on top), row on desktop */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
                {/* Back button */}
                {(step === 'review' || step === 'destination') && (
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {/* Spacer for desktop layout when no back button */}
                {step === 'input' && <div className="hidden sm:block" />}
                {step === 'processing' && <div className="hidden sm:block" />}

                {/* Main action button */}
                {step === 'input' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={parsedUrls.length === 0}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[var(--teed-green-9)] text-white rounded-lg text-sm font-medium hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Analyze {parsedUrls.length > 0 ? parsedUrls.length : ''} Link{parsedUrls.length !== 1 ? 's' : ''}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 'processing' && (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[var(--teed-green-9)] text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </button>
                )}

                {step === 'review' && (
                  <button
                    onClick={handleNext}
                    disabled={totalSelected === 0}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[var(--teed-green-9)] text-white rounded-lg text-sm font-medium hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {needsDestination ? 'Continue' : 'Add to Profile'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 'destination' && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !selectedBagCode || (selectedBagCode === 'new' && !newBagTitle.trim())}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[var(--teed-green-9)] text-white rounded-lg text-sm font-medium hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Add All
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
