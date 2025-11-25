'use client';

import { useState } from 'react';
import { X, FileText, Loader2, Youtube, Sparkles } from 'lucide-react';

type TranscriptProcessorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProductsExtracted: (products: any[]) => void;
  bagType?: string;
};

export default function TranscriptProcessorModal({
  isOpen,
  onClose,
  onProductsExtracted,
  bagType,
}: TranscriptProcessorModalProps) {
  const [transcript, setTranscript] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_LENGTH = 50;
  const MAX_LENGTH = 100000;

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);

    if (transcript.trim().length < MIN_LENGTH) {
      setError(`Transcript is too short. Please provide at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (transcript.trim().length > MAX_LENGTH) {
      setError(`Transcript is too long. Maximum ${MAX_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          bagType,
          youtubeUrl: youtubeUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transcript');
      }

      const result = await response.json();

      if (!result.products || result.products.length === 0) {
        setError('No products found in the transcript. Please make sure specific product names and brands are mentioned.');
        setIsProcessing(false);
        return;
      }

      onProductsExtracted(result.products);
      // Reset state
      setTranscript('');
      setYoutubeUrl('');
      setError(null);
    } catch (err: any) {
      console.error('Transcript processing error:', err);
      setError(err.message || 'Failed to process transcript. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setTranscript('');
    setYoutubeUrl('');
    setError(null);
    onClose();
  };

  const charCount = transcript.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--sky-3)] rounded-lg">
              <FileText className="w-5 h-5 text-[var(--teed-green-9)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Process Transcript
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Paste a video or podcast transcript to extract product mentions
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* YouTube URL (optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
              <Youtube className="w-4 h-4" />
              YouTube URL (optional)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-8)] focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              disabled={isProcessing}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Helps provide context for product extraction
            </p>
          </div>

          {/* Transcript textarea */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-[var(--text-primary)] mb-2">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Transcript
              </span>
              <span className={`text-xs ${
                charCount < MIN_LENGTH
                  ? 'text-[var(--copper-9)]'
                  : charCount > MAX_LENGTH
                  ? 'text-[var(--copper-9)]'
                  : 'text-[var(--text-tertiary)]'
              }`}>
                {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Paste your transcript here...

Example:
"Hey everyone, today I'm reviewing the TaylorMade Stealth 2 driver with the Project X HZRDUS Smoke shaft. I've also got the Titleist Pro V1 golf balls that I've been using this season..."`}
              rows={12}
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-8)] focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none font-mono text-sm"
              disabled={isProcessing}
            />
            {charCount < MIN_LENGTH && charCount > 0 && (
              <p className="text-xs text-[var(--copper-9)] mt-1">
                Need {MIN_LENGTH - charCount} more characters
              </p>
            )}
          </div>

          {/* Info card */}
          <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              💡 Tips for best results:
            </h3>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              <li>• Include specific brand names and product models</li>
              <li>• The AI will extract products that are explicitly mentioned</li>
              <li>• Longer, more detailed transcripts work better</li>
              <li>• You can get YouTube transcripts from YouTube Studio or browser extensions</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-lg p-3">
              <p className="text-sm text-[var(--copper-11)]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--sky-1)] flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Products
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
