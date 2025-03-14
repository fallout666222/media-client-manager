
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { DEFAULT_SYSTEM_CLIENTS } from './constants';

interface SearchableListProps {
  items: string[];
  searchTerm: string;
  selectedItems: string[];
  onSearchChange: (value: string) => void;
  onToggleSelection: (item: string, checked: boolean) => void;
  onAddSelected: () => void;
  emptyMessage: string;
  noResultsMessage: string;
  addButtonText: string;
  itemRenderer?: (item: string) => React.ReactNode;
  isSystemItem?: (item: string) => boolean;
}

export const SearchableList: React.FC<SearchableListProps> = ({
  items,
  searchTerm,
  selectedItems,
  onSearchChange,
  onToggleSelection,
  onAddSelected,
  emptyMessage,
  noResultsMessage,
  addButtonText,
  itemRenderer,
  isSystemItem = () => false
}) => {
  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <ScrollArea className="h-48 border rounded-md p-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox 
                  id={`item-${item}`} 
                  checked={selectedItems.includes(item)}
                  onCheckedChange={(checked) => onToggleSelection(item, checked === true)}
                />
                <label 
                  htmlFor={`item-${item}`} 
                  className="text-sm flex-1 cursor-pointer"
                >
                  {itemRenderer ? (
                    itemRenderer(item)
                  ) : (
                    <>
                      {item}
                      {isSystemItem(item) && (
                        <span className="ml-2 text-xs font-medium text-blue-600">(System)</span>
                      )}
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <Button 
        onClick={onAddSelected} 
        disabled={selectedItems.length === 0}
        className="w-full"
      >
        {selectedItems.length > 0 
          ? `${addButtonText} (${selectedItems.length})` 
          : addButtonText}
      </Button>
    </div>
  );
};
