'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

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
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white p-2 rounded-lg shadow-sm border border-[var(--border-subtle)]">
        <canvas ref={canvasRef} className="block" />
      </div>

      {label && !compact && (
        <p className="text-xs text-[var(--text-secondary)] text-center">
          {label}
        </p>
      )}

      {downloadable && (
        <button
          onClick={handleDownload}
          disabled={!qrCodeDataUrl}
          className={`flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            compact
              ? 'p-2 min-h-[36px] min-w-[36px] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              : 'px-3 py-1.5 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)]'
          }`}
          title="Download QR Code"
          aria-label="Download QR Code"
        >
          <Download className="w-4 h-4" />
          {!compact && <span>Download</span>}
        </button>
      )}
    </div>
  );
}
