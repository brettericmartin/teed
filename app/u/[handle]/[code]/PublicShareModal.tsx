'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface PublicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  bagTitle: string;
  ownerHandle: string;
  ownerName: string;
}

export default function PublicShareModal({
  isOpen,
  onClose,
  bagCode,
  bagTitle,
  ownerHandle,
  ownerName,
}: PublicShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          text: `Check out ${ownerName}'s ${bagTitle} on Teed`,
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
    link.download = `${ownerHandle}-${bagCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-[var(--overlay-bg)] flex items-center justify-center p-4 z-50 backdrop-blur-sm modal-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-md w-full border border-[var(--modal-border)] modal-content-enter"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-[var(--border-subtle)]">
              <canvas ref={canvasRef} className="block" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center">
              Scan to view this bag
            </p>
          </div>

          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Share Link
            </label>
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
              <p className="mt-1.5 text-sm text-[var(--teed-green-11)] font-medium">Link copied!</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadQR}
              disabled={!qrCodeDataUrl}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-colors"
              >
                Share via...
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--sky-1)] border-t border-[var(--border-subtle)] rounded-b-[var(--radius-2xl)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 min-h-[44px] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
