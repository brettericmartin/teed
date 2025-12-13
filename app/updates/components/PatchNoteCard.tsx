import { PatchNote, CategoryType } from '../data/patchNotes';
import { CategoryBadge } from './CategoryBadge';

interface PatchNoteCardProps {
  note: PatchNote;
  isHero?: boolean;
  animationDelay?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getUniqueCategories(note: PatchNote): CategoryType[] {
  const categories = new Set<CategoryType>();
  note.changes.forEach(change => categories.add(change.category));
  return Array.from(categories);
}

export function PatchNoteCard({ note, isHero = false, animationDelay = '' }: PatchNoteCardProps) {
  const categories = getUniqueCategories(note);

  if (isHero) {
    return (
      <div className={`fade-in-section ${animationDelay}`}>
        <div className="relative p-8 md:p-10 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-3)] border border-[var(--border-subtle)] overflow-hidden">
          {/* Accent border on left */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--teed-green-6)] to-[var(--teed-green-8)]" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-[var(--teed-green-9)] bg-[var(--teed-green-3)] px-3 py-1 rounded-full">
                  v{note.version}
                </span>
                <span className="text-sm text-[var(--text-tertiary)]">
                  {formatDate(note.releaseDate)}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                {note.title}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <CategoryBadge key={category} category={category} />
              ))}
            </div>
          </div>

          {/* Summary */}
          {note.summary && (
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              {note.summary}
            </p>
          )}

          {/* Changes list */}
          <div className="space-y-3">
            {note.changes.map((change, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${change.category === 'feature' ? 'bg-[var(--teed-green-8)]' : ''}
                  ${change.category === 'improvement' ? 'bg-[var(--sky-8)]' : ''}
                  ${change.category === 'bugfix' ? 'bg-[var(--sand-8)]' : ''}
                `} />
                <p className="text-[var(--text-secondary)]">{change.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Compact card variant
  return (
    <div className={`fade-in-section group ${animationDelay}`}>
      <div className="h-full p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:-translate-y-2">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-[var(--teed-green-9)] bg-[var(--teed-green-3)] px-2.5 py-0.5 rounded-full">
            v{note.version}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatDate(note.releaseDate)}
          </span>
        </div>

        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          {note.title}
        </h3>

        {/* Summary */}
        {note.summary && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {note.summary}
          </p>
        )}

        {/* Category badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map(category => (
            <CategoryBadge key={category} category={category} className="text-[10px] px-2 py-0.5" />
          ))}
        </div>

        {/* Changes list (condensed) */}
        <ul className="space-y-1.5">
          {note.changes.slice(0, 3).map((change, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className={`
                w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                ${change.category === 'feature' ? 'bg-[var(--teed-green-8)]' : ''}
                ${change.category === 'improvement' ? 'bg-[var(--sky-8)]' : ''}
                ${change.category === 'bugfix' ? 'bg-[var(--sand-8)]' : ''}
              `} />
              <span className="line-clamp-2">{change.text}</span>
            </li>
          ))}
          {note.changes.length > 3 && (
            <li className="text-xs text-[var(--text-tertiary)] pl-3.5">
              +{note.changes.length - 3} more
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
