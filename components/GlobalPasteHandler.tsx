'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { classifyUrl, isValidUrl } from '@/lib/linkIntelligence/classifier';
import type { ClassifiedUrl } from '@/lib/linkIntelligence/types';
import { LinkProcessorModal } from './LinkProcessorModal';
import { useCelebration } from '@/lib/celebrations';
import * as bagsApi from '@/lib/api/domains/bags';
import * as universalLinksApi from '@/lib/api/domains/universal-links';
import { analytics } from '@/lib/analytics';

interface Bag {
  id: string;
  title: string;
  code: string;
}

interface GlobalPasteHandlerProps {
  profileHandle: string;
  isOwner: boolean;
  onAddEmbedBlock?: (url: string, classification: ClassifiedUrl) => Promise<void>;
  onAddSocialLink?: (url: string, platform: string) => Promise<void>;
}

/**
 * GlobalPasteHandler - Universal link drop for profiles
 *
 * Listens for paste events anywhere on the page. When a valid URL is pasted:
 * 1. Instantly classifies it using Link Intelligence (~10ms)
 * 2. Shows SmartLinkToast with contextual actions
 * 3. Handles routing to appropriate creation flow
 *
 * This component should be placed at the profile layout level.
 */
export function GlobalPasteHandler({
  profileHandle,
  isOwner,
  onAddEmbedBlock,
  onAddSocialLink,
}: GlobalPasteHandlerProps) {
  const router = useRouter();
  const { celebrateItemAdded } = useCelebration();

  // State
  const [classification, setClassification] = useState<ClassifiedUrl | null>(null);
  const [userBags, setUserBags] = useState<Bag[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Fetch user's bags on mount (only if owner)
  useEffect(() => {
    if (!isOwner) return;
    async function fetchBags() {
      try {
        const data = await bagsApi.listMine();
        setUserBags((data.bags || []).slice(0, 5)); // Only show 5 most recent
      } catch (error) {
        console.error('Failed to fetch bags:', error);
      }
    }
    fetchBags();
  }, [isOwner]);

  // Handle paste event
  const handlePaste = useCallback((e: ClipboardEvent) => {
    // Don't intercept if typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[data-no-paste-handler]')
    ) {
      return;
    }

    // Get pasted text
    const text = e.clipboardData?.getData('text')?.trim();
    if (!text) return;

    // Check if it's a valid URL
    if (!isValidUrl(text)) return;

    // Prevent default paste behavior
    e.preventDefault();

    // Classify the URL instantly
    const result = classifyUrl(text);
    setClassification(result);
    setShowToast(true);
    analytics.pasteDetected(text, result.type, 'showed_modal');
  }, []);

  // Listen for paste events (only if owner)
  useEffect(() => {
    if (!isOwner) return;
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste, isOwner]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setShowToast(false);
    setClassification(null);
  }, []);

  // Handle add to profile (for embeds)
  const handleAddToProfile = useCallback(async () => {
    if (!classification || !onAddEmbedBlock) return;

    try {
      await onAddEmbedBlock(classification.normalizedUrl, classification);
      celebrateItemAdded();
      handleDismiss();
    } catch (error) {
      console.error('Failed to add embed:', error);
      throw error; // Re-throw so LinkProcessorModal can show error state
    }
  }, [classification, onAddEmbedBlock, celebrateItemAdded, handleDismiss]);

  // Handle add to bag
  const handleAddToBag = useCallback(async (bagId: string | null) => {
    if (!classification) return;

    try {
      if (bagId === null) {
        // Create new bag first, then redirect to editor with URL param
        router.push(`/bags/new?url=${encodeURIComponent(classification.normalizedUrl)}`);
        handleDismiss();
      } else {
        // Add item to existing bag via API
        await universalLinksApi.save({
          url: classification.normalizedUrl,
          destination: {
            type: 'bag',
            bagId,
          },
        });

        celebrateItemAdded();
        handleDismiss();

        // Find bag code and redirect to edit
        const bag = userBags.find(b => b.id === bagId);
        if (bag) {
          router.push(`/u/${profileHandle}/${bag.code}/edit`);
        }
      }
    } catch (error) {
      console.error('Failed to add to bag:', error);
      throw error; // Re-throw so LinkProcessorModal can show error state
    }
  }, [classification, router, profileHandle, userBags, celebrateItemAdded, handleDismiss]);

  // Handle add to social links
  const handleAddToSocialLinks = useCallback(async () => {
    if (!classification || !onAddSocialLink) return;

    try {
      await onAddSocialLink(classification.normalizedUrl, classification.platform);
      celebrateItemAdded();
      handleDismiss();
    } catch (error) {
      console.error('Failed to add social link:', error);
      throw error; // Re-throw so LinkProcessorModal can show error state
    }
  }, [classification, onAddSocialLink, celebrateItemAdded, handleDismiss]);

  // Don't render if not owner or no modal to show
  if (!isOwner || !classification) return null;

  return (
    <LinkProcessorModal
      isOpen={showToast}
      classification={classification}
      onClose={handleDismiss}
      onAddToProfile={classification.type === 'embed' ? handleAddToProfile : undefined}
      onAddToBag={handleAddToBag}
      onAddToSocialLinks={classification.type === 'social' ? handleAddToSocialLinks : undefined}
      userBags={userBags}
    />
  );
}
