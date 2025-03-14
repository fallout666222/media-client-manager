
import React from 'react';
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
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import { DEFAULT_SYSTEM_CLIENTS } from './constants';

interface SortableItemsListProps {
  items: string[];
  onReorder: (newOrder: string[]) => void;
  onRemoveItem: (item: string) => void;
  emptyMessage: string;
  isSystemItem?: (item: string) => boolean;
}

export const SortableItemsList: React.FC<SortableItemsListProps> = ({
  items,
  onReorder,
  onRemoveItem,
  emptyMessage,
  isSystemItem = (item) => DEFAULT_SYSTEM_CLIENTS.includes(item)
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates => sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...items];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        
        onReorder(newOrder);
      }
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items} 
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <SortableItem
              key={item}
              id={item}
              onRemove={() => onRemoveItem(item)}
              isSystemItem={isSystemItem(item)}
            >
              {item}
              {isSystemItem(item) && (
                <span className="ml-1 text-xs font-medium">(System)</span>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
