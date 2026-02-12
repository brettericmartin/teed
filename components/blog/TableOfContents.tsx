'use client';

import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Parse headings from raw MDX content
  const headings: TocItem[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
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

  useEffect(() => {
    if (headings.length === 0) return;

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

  return (
    <nav className="hidden lg:block sticky top-24 w-56 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
        On this page
      </p>
      <ul className="space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : 0 }}>
            <a
              href={`#${h.id}`}
              className={`block py-0.5 transition-colors leading-snug ${
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
    </nav>
  );
}
