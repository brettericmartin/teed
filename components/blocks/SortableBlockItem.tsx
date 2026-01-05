'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

interface SortableBlockItemProps {
  id: string;
  children: (props: {
    isDragging: boolean;
    dragHandleProps: Record<string, any>;
  }) => ReactNode;
}

export default function SortableBlockItem({ id, children }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  // Combine the activator ref and listeners for the drag handle
  const dragHandleProps = {
    ...attributes,
    ...listeners,
    ref: setActivatorNodeRef,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ isDragging, dragHandleProps })}
    </div>
  );
}
