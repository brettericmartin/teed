import { CategoryType, CATEGORY_META } from '../data/patchNotes';

interface CategoryBadgeProps {
  category: CategoryType;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];

  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        rounded-full
        text-xs font-medium
        border
        ${meta.bgClass}
        ${meta.textClass}
        ${meta.borderClass}
        ${className}
      `}
    >
      {meta.label}
    </span>
  );
}
