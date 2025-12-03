'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  downloadable?: boolean;
  label?: string;
  downloadFileName?: string;
  className?: string;
  compact?: boolean;
}

export default function QRCodeDisplay({
  url,
  size = 120,
  downloadable = true,
  label,
  downloadFileName = 'qr-code',
  className = '',
  compact = false,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    // Generate QR code on canvas
    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (error) => {
        if (error) console.error('QR Code generation error:', error);
      }
    );

    // Generate data URL for download (higher resolution)
    if (downloadable) {
      QRCode.toDataURL(
        url,
        {
          width: 512,
          margin: 2,
        },
        (error, dataUrl) => {
          if (error) console.error('QR Code data URL error:', error);
          else setQrCodeDataUrl(dataUrl);
        }
      );
    }
  }, [url, size, downloadable]);

  // Generate modal QR code when modal opens
  useEffect(() => {
    if (!showModal || !url || !modalCanvasRef.current) return;

    QRCode.toCanvas(
      modalCanvasRef.current,
      url,
      {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (error) => {
        if (error) console.error('Modal QR Code generation error:', error);
      }
    );
  }, [showModal, url]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${downloadFileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!url) return null;

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {/* Clickable QR code */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-white p-2 rounded-lg shadow-sm border border-[var(--border-subtle)] cursor-pointer hover:shadow-md transition-shadow"
          title="Click to enlarge & download"
          aria-label="Click to enlarge QR code"
        >
          <canvas ref={canvasRef} className="block" />
        </button>

        {label && !compact && (
          <p className="text-xs text-[var(--text-secondary)] text-center">
            {label}
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[var(--surface)] rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                QR Code
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border-subtle)]">
                <canvas ref={modalCanvasRef} className="block" />
              </div>
            </div>

            {/* Instructions */}
            <p className="text-sm text-[var(--text-secondary)] text-center mb-4">
              Scan to view this bag or download to share
            </p>

            {/* Download button */}
            {downloadable && (
              <button
                onClick={handleDownload}
                disabled={!qrCodeDataUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
