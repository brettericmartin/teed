'use client';

import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  /**
   * `sidebar` (default): the sticky column at lg and up.
   * `inline`: a collapsible "On this page" block for phones, rendered at the top of
   * the article. The sidebar was the only map and it is hidden below lg, which left a
   * 15,000 px guide with no map on a 390 px screen.
   */
  variant?: 'sidebar' | 'inline';
}

function parseHeadings(content: string): TocItem[] {
  const headings: TocItem[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export default function TableOfContents({ content, variant = 'sidebar' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const headings = parseHeadings(content);

  useEffect(() => {
    if (headings.length === 0 || variant !== 'sidebar') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (headings.length < 3) return null;

  const list = (
    <ul className="space-y-1.5 text-sm">
      {headings.map((h) => (
        <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : 0 }}>
          <a
            href={`#${h.id}`}
            className={`block py-1 lg:py-0.5 transition-colors leading-snug ${
              activeId === h.id
                ? 'text-[var(--teed-green-9)] font-medium'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === 'inline') {
    return (
      <details className="lg:hidden mb-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <summary className="cursor-pointer select-none px-4 py-3 min-h-[44px] flex items-center text-sm font-semibold text-[var(--text-primary)]">
          On this page ({headings.length} sections)
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    );
  }

  return (
    <nav className="hidden lg:block sticky top-24 w-56 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
        On this page
      </p>
      {list}
    </nav>
  );
}
