
import React from 'react';
import SearchBar from "@/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  itemsPerPageOptions: number[];
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  searchQuery,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="w-1/3">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search clients..."
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
  );
};
