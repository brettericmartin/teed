import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

function Callout({
  variant = 'info',
  children,
}: {
  variant?: 'tip' | 'warning' | 'info';
  children: React.ReactNode;
}) {
  const styles = {
    tip: 'border-[var(--teed-green-7)] bg-[var(--teed-green-2)]',
    warning: 'border-[var(--copper-7)] bg-[var(--copper-2)]',
    info: 'border-[var(--sky-7)] bg-[var(--sky-2)]',
  };
  const icons = { tip: '💡', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 my-6 ${styles[variant]}`}>
      <div className="flex gap-3">
        <span className="text-lg flex-shrink-0">{icons[variant]}</span>
        <div className="text-sm text-[var(--text-primary)] [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}

function BagEmbed({ handle, code }: { handle: string; code: string }) {
  return (
    <div className="my-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Featured bag</p>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            @{handle}/{code}
          </p>
        </div>
        <Link
          href={`/u/${handle}/${code}`}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] rounded-lg transition-colors"
        >
          View Bag
        </Link>
      </div>
    </div>
  );
}

function ItemSpotlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)]">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
        Item Spotlight
      </p>
      <div className="text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

export function getMDXComponents(): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-10 mb-4 leading-tight"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        id={slugify(props.children)}
        className="text-2xl font-bold text-[var(--text-primary)] mt-8 mb-3 leading-snug scroll-mt-24"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        id={slugify(props.children)}
        className="text-xl font-semibold text-[var(--text-primary)] mt-6 mb-2 leading-snug scroll-mt-24"
        {...props}
      />
    ),
    p: (props) => (
      <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4" {...props} />
    ),
    a: (props) => (
      <a
        className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] underline underline-offset-2 transition-colors"
        {...props}
      />
    ),
    ul: (props) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-[var(--text-secondary)]" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-[var(--text-secondary)]" {...props} />
    ),
    li: (props) => <li className="text-base leading-relaxed" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-[var(--border-default)] pl-4 my-6 italic text-[var(--text-secondary)]"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="bg-[var(--surface-hover)] text-[var(--text-primary)] px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="bg-[var(--evergreen-12)] text-[var(--teed-green-3)] rounded-lg p-4 overflow-x-auto my-6 text-sm font-mono leading-relaxed"
        {...props}
      />
    ),
    hr: () => <hr className="border-[var(--border-subtle)] my-8" />,
    img: (props) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="rounded-lg my-6 max-w-full" alt={props.alt || ''} {...props} />
    ),
    table: (props) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)] px-3 py-2"
        {...props}
      />
    ),
    td: (props) => (
      <td
        className="text-[var(--text-secondary)] border-b border-[var(--border-subtle)] px-3 py-2"
        {...props}
      />
    ),
    // Custom components
    Callout,
    BagEmbed,
    ItemSpotlight,
  };
}

function slugify(children: React.ReactNode): string {
  const text = typeof children === 'string' ? children : '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
