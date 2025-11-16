'use client';

import { useState } from 'react';
import ItemCard from './ItemCard';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
};

type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  custom_photo_id: string | null;
  photo_url: string | null;
  promo_codes: string | null;
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
  const sortedItems = [...items].sort((a, b) => a.sort_index - b.sort_index);

  return (
    <div className="space-y-4">
      {sortedItems.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          onUpdate={onUpdate}
          bagCode={bagCode}
        />
      ))}
    </div>
  );
}
