'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ExternalLink, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagCode: string;
  bagTitle: string;
  isPublic: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  bagCode,
  bagTitle,
  isPublic,
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

  // Generate QR code when URL changes
  useEffect(() => {
    if (shareUrl && canvasRef.current) {
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
  }, [shareUrl]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share Bag</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Privacy Warning */}
          {!isPublic && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    This bag is private
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Only you can view this bag. Toggle privacy to public to share it with others.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 overflow-x-auto whitespace-nowrap">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={copied ? 'Copied!' : 'Copy link'}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs text-green-600">Link copied to clipboard!</p>
            )}
          </div>

          {/* QR Code */}
          {isPublic && shareUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code
              </label>
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <canvas
                  ref={canvasRef}
                  className="border-4 border-white shadow-sm rounded-lg"
                />
                <button
                  onClick={handleDownloadQR}
                  disabled={!qrCodeDataUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
                <p className="text-xs text-gray-500 text-center">
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
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Public View
            </a>
          )}

          {/* Native Share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && isPublic && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Share via...
            </button>
          )}

          {/* Share Info */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">When you share this bag:</p>
            <ul className="space-y-1 ml-4 list-disc list-outside">
              <li>Anyone with the link can view all items and links</li>
              <li>Your username will be visible</li>
              <li>Items and links can be clicked to view details</li>
              <li>The bag will be read-only for visitors</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
