'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

export type ItemSpecs = {
  [key: string]: string | number | boolean;
};

export type Section = {
  id: string;
  name: string;
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
  section_id: string | null;
  // Context fields (Phase 1)
  why_chosen: string | null;
  specs: ItemSpecs;
  compared_to: string | null;
  alternatives: string[] | null;
  price_paid: number | null;
  purchase_date: string | null;
  links: Link[];
};

type ReorderItem = { id: string; sort_index: number };

type ItemListProps = {
  items: Item[];
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>) => void;
  onReorder: (items: ReorderItem[]) => Promise<void>;
  bagCode: string;
  heroItemId?: string | null;
  onToggleHero?: (itemId: string) => void;
  sections?: Section[];
};

export default function ItemList({ items, onDelete, onUpdate, onReorder, bagCode, heroItemId, onToggleHero, sections = [] }: ItemListProps) {
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
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
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

    // Optimistically update UI immediately
    setSortedItems(newItems);

    // Only update items whose sort_index actually changed
    const changedItems = newItems
      .map((item, index) => ({
        id: item.id,
        sort_index: index,
        oldSortIndex: item.sort_index,
      }))
      .filter((item) => item.sort_index !== item.oldSortIndex)
      .map(({ id, sort_index }) => ({ id, sort_index }));

    if (changedItems.length > 0) {
      try {
        await onReorder(changedItems);
      } catch (error) {
        console.error('Failed to reorder items:', error);
        // Revert on error
        setSortedItems([...items].sort((a, b) => a.sort_index - b.sort_index));
      }
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
              isHero={heroItemId === item.id}
              onToggleHero={onToggleHero}
              sections={sections}
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
              isHero={heroItemId === item.id}
              onToggleHero={onToggleHero}
              sections={sections}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
