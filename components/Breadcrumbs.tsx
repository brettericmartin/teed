'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {/* Home Icon (Optional) */}
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center p-1.5 -ml-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px] min-w-[36px]"
                aria-label="Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li>
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
              </li>
            )}
          </>
        )}

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 py-1.5 px-1 -ml-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors min-h-[36px]"
                >
                  {item.icon}
                  <span className="max-w-[120px] sm:max-w-[150px] md:max-w-[200px] truncate">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 py-1.5 px-1 -ml-1 text-[var(--text-primary)] font-medium min-h-[36px]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="max-w-[120px] sm:max-w-[150px] md:max-w-[200px] truncate">
                    {item.label}
                  </span>
                </span>
              )}

              {/* Separator (if not last) */}
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
