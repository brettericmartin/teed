'use client';

import { QuoteBlockConfig } from '@/lib/blocks/types';
import { Quote } from 'lucide-react';

interface QuoteBlockProps {
  config: QuoteBlockConfig;
}

/**
 * Quote/Testimonial Block
 * DOCTRINE: Authoritative social proof without engagement metrics.
 */
export default function QuoteBlock({ config }: QuoteBlockProps) {
  const {
    quote,
    attribution,
    source,
    sourceUrl,
    style = 'callout',
    alignment = 'left',
    showQuotationMarks = true,
  } = config;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const styleClasses = {
    minimal: 'py-2',
    callout: 'px-6 py-4 border-l-4 border-[var(--teed-green-8)] bg-[var(--teed-green-1)]',
    card: 'px-6 py-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
  };

  return (
    <div className={`px-4 py-4 h-full flex flex-col justify-center ${alignmentClasses[alignment]}`}>
      <blockquote className={`${styleClasses[style]} rounded-lg`}>
        <div className="relative">
          {showQuotationMarks && (
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-[var(--teed-green-6)] opacity-60" />
          )}
          <p className={`text-lg leading-relaxed text-[var(--text-primary)] ${showQuotationMarks ? 'pl-5' : ''}`}>
            {quote}
          </p>
        </div>

        {(attribution || source) && (
          <footer className="mt-3 flex items-center gap-2">
            <span className="w-8 h-px bg-[var(--border-subtle)]" />
            <cite className="text-sm text-[var(--text-secondary)] not-italic">
              {attribution && <span className="font-medium">{attribution}</span>}
              {attribution && source && <span className="mx-1.5">·</span>}
              {source && (
                sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--teed-green-9)] hover:underline"
                  >
                    {source}
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">{source}</span>
                )
              )}
            </cite>
          </footer>
        )}
      </blockquote>
    </div>
  );
}
