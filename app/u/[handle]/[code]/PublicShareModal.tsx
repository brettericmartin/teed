'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download, Share2, Link2, QrCode, Code, FileOutput } from 'lucide-react';
import QRCode from 'qrcode';
import { useCelebration } from '@/lib/celebrations';
import { modalOverlay, modalContent } from '@/lib/animations';
import { analytics } from '@/lib/analytics';
import EmbedCodeGenerator from '@/components/share/EmbedCodeGenerator';
import PlatformExports from '@/components/share/PlatformExports';
import { FeatureBadge, FEATURE_RELEASES, useFeatureDiscovery } from '@/components/ui/FeatureBadge';

type ShareTab = 'link' | 'qr' | 'embed' | 'export';

interface PublicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagId: string;
  bagCode: string;
  bagTitle: string;
  ownerHandle: string;
  ownerName: string;
}

export default function PublicShareModal({
  isOpen,
  onClose,
  bagId,
  bagCode,
  bagTitle,
  ownerHandle,
  ownerName,
}: PublicShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('link');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { celebrateShare } = useCelebration();

  // Feature discovery for new tabs
  const embedDiscovery = useFeatureDiscovery('share-embed-tab', FEATURE_RELEASES['share-embed-tab']);
  const exportDiscovery = useFeatureDiscovery('share-export-tab', FEATURE_RELEASES['share-export-tab']);

  // Update share URL when modal opens (to capture current view mode from URL)
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      setShareUrl(window.location.href);
    }
  }, [isOpen]);

  // Generate QR code when URL changes
  useEffect(() => {
    if (shareUrl && canvasRef.current && isOpen) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );

      // Also generate data URL for download
      QRCode.toDataURL(
        shareUrl,
        {
          width: 512,
          margin: 2,
        },
        (error, url) => {
          if (error) console.error('QR Code data URL error:', error);
          else setQrCodeDataUrl(url);
        }
      );
    }
  }, [shareUrl, isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      analytics.bagShared(bagId, bagCode, 'copy_link');
      celebrateShare(); // Trigger confetti celebration
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bagTitle,
          text: `Check out ${ownerName}'s ${bagTitle} on Teed`,
          url: shareUrl,
        });
        analytics.bagShared(bagId, bagCode, 'native_share');
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;

    analytics.bagShared(bagId, bagCode, 'qr_code');
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${ownerHandle}-${bagCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-[var(--modal-bg)] rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-md w-full border border-[var(--modal-border)] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Share This Bag</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              by @{ownerHandle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--surface-hover)]"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-subtle)]">
          {[
            { id: 'link' as ShareTab, label: 'Link', icon: Link2, isNew: false },
            { id: 'qr' as ShareTab, label: 'QR', icon: QrCode, isNew: false },
            { id: 'embed' as ShareTab, label: 'Embed', icon: Code, isNew: embedDiscovery.shouldShow },
            { id: 'export' as ShareTab, label: 'Export', icon: FileOutput, isNew: exportDiscovery.shouldShow },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Mark feature as seen when tab is clicked
                if (tab.id === 'embed') embedDiscovery.markAsSeen();
                if (tab.id === 'export') exportDiscovery.markAsSeen();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[var(--teed-green-11)] border-b-2 border-[var(--teed-green-9)] -mb-[1px]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.isNew && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--teed-green-9)] rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Link Tab */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Your collection link
                </label>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">
                  Add this to your bio or share directly
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-[var(--sky-2)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] overflow-x-auto whitespace-nowrap font-mono">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`p-2.5 min-h-[44px] min-w-[44px] rounded-lg transition-all flex items-center justify-center ${
                      copied
                        ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                        : 'bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-bg-hover)]'
                    }`}
                    title={copied ? 'Copied!' : 'Copy link'}
                    aria-label={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {copied && (
                  <p className="mt-1.5 text-sm text-[var(--teed-green-11)] font-medium">Copied!</p>
                )}
              </div>

              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share via...
                </button>
              )}
            </div>
          )}

          {/* QR Tab */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-[var(--border-subtle)]">
                  <canvas ref={canvasRef} className="block" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    Point a camera to view
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Great for business cards, packaging, or printed materials
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadQR}
                disabled={!qrCodeDataUrl}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && (
            <EmbedCodeGenerator
              type="bag"
              handle={ownerHandle}
              code={bagCode}
              title={bagTitle}
            />
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <PlatformExports
              bagCode={bagCode}
              bagTitle={bagTitle}
              ownerHandle={ownerHandle}
            />
          )}
        </div>

        {/* Footer */}
            <div className="px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 bg-[var(--sky-1)] border-t border-[var(--border-subtle)] sm:rounded-b-[var(--radius-2xl)]">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 min-h-[44px] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
