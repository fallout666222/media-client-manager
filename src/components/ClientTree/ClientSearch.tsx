
import React from 'react';
import SearchBar from "@/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client } from '@/types/timesheet';

interface ClientSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  parentSearchQuery: string;
  onParentSearchChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  itemsPerPageOptions: number[];
  clients: Client[];
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  searchQuery,
  onSearchChange,
  parentSearchQuery,
  onParentSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions,
  clients
}) => {
  // Build a list of unique parent client names for filtering
  const uniqueParentClients = React.useMemo(() => {
    const parentIds = clients
      .filter(client => client.parentId)
      .map(client => client.parentId);
    
    return clients
      .filter(client => parentIds.includes(client.id))
      .map(client => client.name);
  }, [clients]);

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="w-1/3">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search clients by name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-1/3">
          <SearchBar
            value={parentSearchQuery}
            onChange={onParentSearchChange}
            placeholder="Filter by parent client..."
          />
        </div>
        {parentSearchQuery && (
          <button 
            onClick={() => onParentSearchChange('')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Clear parent filter
          </button>
        )}
      </div>
    </div>
  );
};
