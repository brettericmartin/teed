'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import ItemCard from './ItemCard';
import { Item } from './ItemList';

type SortableItemCardProps = {
  item: Item;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>) => void;
  bagCode: string;
  isHero?: boolean;
  onToggleHero?: (itemId: string) => void;
};

export default function SortableItemCard({ item, onDelete, onUpdate, bagCode, isHero, onToggleHero }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 hover:bg-[var(--surface-hover)] rounded touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-[var(--text-tertiary)]" />
      </button>
      <ItemCard
        item={item}
        onDelete={onDelete}
        onUpdate={onUpdate}
        bagCode={bagCode}
        isHero={isHero}
        onToggleHero={onToggleHero}
      />
    </div>
  );
}
