'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ExternalLink, Download, AlertTriangle, Eye, Code, Link2 } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  bagTitle: string;
  isPublic: boolean;
  ownerHandle: string;
  onTogglePublic?: () => void;
}

type EmbedSize = 'compact' | 'standard' | 'large';

const EMBED_SIZES: Record<EmbedSize, { width: number; height: number; label: string }> = {
  compact: { width: 400, height: 300, label: 'Compact' },
  standard: { width: 600, height: 400, label: 'Standard' },
  large: { width: 800, height: 500, label: 'Large' },
};

type TabId = 'link' | 'embed';

export default function ShareModal({
  isOpen,
  onClose,
  bagCode,
  bagTitle,
  isPublic,
  ownerHandle,
  onTogglePublic,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('link');
  const [embedSize, setEmbedSize] = useState<EmbedSize>('standard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/u/${ownerHandle}/${bagCode}`;
      setShareUrl(url);
    }
  }, [bagCode, ownerHandle]);

  // Generate QR code when URL changes or modal opens
  useEffect(() => {
    if (shareUrl && canvasRef.current && isOpen) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 256,
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

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
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
          text: `Check out my ${bagTitle} bag on Teed`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${bagCode}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Embed functionality
  const embedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/embed/bag/${ownerHandle}/${bagCode}`
    : `https://teed.club/embed/bag/${ownerHandle}/${bagCode}`;

  const { width: embedWidth, height: embedHeight } = EMBED_SIZES[embedSize];

  const embedCode = `<iframe src="${embedUrl}" width="${embedWidth}" height="${embedHeight}" frameborder="0" scrolling="no" allowtransparency="true" title="${bagTitle}" style="border-radius: 12px; border: 1px solid #e5e7eb;"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[var(--overlay-bg)] flex items-end md:items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--modal-bg)] rounded-t-[var(--radius-2xl)] md:rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-lg w-full border border-[var(--modal-border)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - sticky */}
        <div className="p-4 md:p-6 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">Share Bag</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Code: <span className="font-mono font-semibold">{bagCode}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg p-2 hover:bg-[var(--surface-hover)] -mr-2"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[var(--grey-2)] rounded-lg">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'link'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Link & QR
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'embed'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Code className="w-4 h-4" />
              Embed
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {/* Privacy Warning - shown on both tabs */}
          {!isPublic && (
            <div className="bg-[var(--sand-2)] border border-[var(--sand-6)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--sand-11)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    This bag is private
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Only you can view this bag. Make it public to share with others.
                  </p>
                  {onTogglePublic && (
                    <button
                      onClick={onTogglePublic}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] text-sm font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Make Public
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Link & QR Tab Content */}
          {activeTab === 'link' && (
            <>
              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Public Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[var(--sky-2)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] overflow-x-auto whitespace-nowrap font-mono">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-all ${
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
                  <p className="mt-1 text-xs text-[var(--teed-green-11)]">Link copied to clipboard!</p>
                )}
              </div>

              {/* QR Code */}
              {isPublic && shareUrl && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    QR Code
                  </label>
                  <div className="flex flex-col items-center gap-3 p-4 bg-[var(--sky-1)] rounded-lg border border-[var(--border-subtle)]">
                    <canvas
                      ref={canvasRef}
                      className="border-4 border-white shadow-sm rounded-lg"
                    />
                    <button
                      onClick={handleDownloadQR}
                      disabled={!qrCodeDataUrl}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                    <p className="text-xs text-[var(--text-secondary)] text-center">
                      Scan this code to instantly open the bag
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Link */}
              {isPublic && (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--sky-2)] hover:bg-[var(--sky-3)] text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview Public View
                </a>
              )}

              {/* Native Share (mobile) */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && isPublic && (
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-2 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] rounded-lg transition-colors"
                >
                  Share via...
                </button>
              )}

              {/* Share Info */}
              <div className="text-sm text-[var(--text-secondary)]">
                <p className="font-medium mb-2 text-[var(--text-primary)]">When you share this bag:</p>
                <ul className="space-y-1 ml-4 list-disc list-outside">
                  <li>Anyone with the link can view all items and links</li>
                  <li>Your username will be visible</li>
                  <li>Items and links can be clicked to view details</li>
                  <li>The bag will be read-only for visitors</li>
                </ul>
              </div>
            </>
          )}

          {/* Embed Tab Content */}
          {activeTab === 'embed' && (
            <>
              {/* Size selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Embed Size
                </label>
                <div className="flex gap-2">
                  {(Object.keys(EMBED_SIZES) as EmbedSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setEmbedSize(size)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        embedSize === size
                          ? 'bg-[var(--teed-green-9)] text-white'
                          : 'bg-[var(--grey-3)] text-[var(--grey-11)] hover:bg-[var(--grey-4)]'
                      }`}
                    >
                      {EMBED_SIZES[size].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--grey-9)] mt-1.5">
                  {embedWidth} × {embedHeight}px
                </p>
              </div>

              {/* Preview */}
              {isPublic && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Preview
                  </label>
                  <div
                    className="bg-[var(--grey-2)] rounded-xl p-4 flex items-center justify-center overflow-hidden"
                    style={{ minHeight: Math.min(embedHeight * 0.6 + 32, 280) }}
                  >
                    <iframe
                      src={embedUrl}
                      width={Math.min(embedWidth, 360)}
                      height={Math.min(embedHeight * 0.6, 240)}
                      frameBorder={0}
                      scrolling="no"
                      title={`${bagTitle} preview`}
                      className="rounded-xl border border-[var(--border-subtle)]"
                    />
                  </div>
                </div>
              )}

              {/* Embed code */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Embed Code
                </label>
                <div className="relative">
                  <pre className="bg-[var(--grey-2)] rounded-xl p-4 pr-12 text-sm text-[var(--grey-11)] overflow-x-auto font-mono whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <button
                    onClick={handleCopyEmbed}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                      embedCopied
                        ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                        : 'bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-9)] text-[var(--grey-11)]'
                    }`}
                    title={embedCopied ? 'Copied!' : 'Copy embed code'}
                  >
                    {embedCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {embedCopied && (
                  <p className="mt-1 text-xs text-[var(--teed-green-11)]">Embed code copied to clipboard!</p>
                )}
              </div>

              {/* Embed Info */}
              <div className="text-sm text-[var(--text-secondary)]">
                <p className="font-medium mb-2 text-[var(--text-primary)]">Embed works with:</p>
                <ul className="space-y-1 ml-4 list-disc list-outside">
                  <li>Notion, Medium, WordPress, and other platforms</li>
                  <li>HTML websites and blogs</li>
                  <li>Platforms that support oEmbed auto-discovery</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer - sticky */}
        <div className="px-4 md:px-6 py-3 md:py-4 bg-[var(--sky-1)] border-t border-[var(--border-subtle)] rounded-b-[var(--radius-2xl)] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
