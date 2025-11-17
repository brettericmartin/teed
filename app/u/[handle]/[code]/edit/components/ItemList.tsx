'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItemCard from './SortableItemCard';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
};

export type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  custom_photo_id: string | null;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  featured_position: number | null;
  links: Link[];
};

type ItemListProps = {
  items: Item[];
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>) => void;
  bagCode: string;
};

export default function ItemList({ items, onDelete, onUpdate, bagCode }: ItemListProps) {
  // Sort items by sort_index
  const [sortedItems, setSortedItems] = useState([...items].sort((a, b) => a.sort_index - b.sort_index));
  const [isMounted, setIsMounted] = useState(false);

  // Only render DndContext on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update sorted items when items prop changes
  useEffect(() => {
    setSortedItems([...items].sort((a, b) => a.sort_index - b.sort_index));
  }, [items]);

  // All hooks must be called before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(sortedItems, oldIndex, newIndex);
    setSortedItems(newItems);

    // Update sort_index for all affected items
    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_index: index,
    }));

    // Update each item's sort_index
    for (const update of updates) {
      await onUpdate(update.id, { sort_index: update.sort_index });
    }
  };

  // Show a simple list during SSR/initial render to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-4">
        {sortedItems.map((item) => (
          <div key={item.id}>
            <SortableItemCard
              item={item}
              onDelete={onDelete}
              onUpdate={onUpdate}
              bagCode={bagCode}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <SortableItemCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              onUpdate={onUpdate}
              bagCode={bagCode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
