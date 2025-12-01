'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ExternalLink, Download, AlertTriangle, Eye } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  bagTitle: string;
  isPublic: boolean;
  onTogglePublic?: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  bagCode,
  bagTitle,
  isPublic,
  onTogglePublic,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/c/${bagCode}`;
      setShareUrl(url);
    }
  }, [bagCode]);

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

  return (
    <div className="fixed inset-0 bg-[var(--overlay-bg)] flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-lg w-full border border-[var(--modal-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] truncate">Share Bag</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
              Code: <span className="font-mono font-semibold">{bagCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--surface-hover)] flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* Privacy Warning */}
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
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] text-sm font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Make Public
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
                className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
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
                  className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-[var(--sky-2)] hover:bg-[var(--sky-3)] text-[var(--text-primary)] rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Public View
            </a>
          )}

          {/* Native Share (mobile) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && isPublic && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-3 min-h-[48px] bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] rounded-lg transition-colors"
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
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-[var(--sky-1)] border-t border-[var(--border-subtle)] rounded-b-[var(--radius-2xl)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-3 min-h-[48px] text-[var(--text-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
