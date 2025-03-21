
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "@/types/timesheet";
import { Input } from "@/components/ui/input";

interface TeamMemberSelectorProps {
  currentUser: User;
  users: User[];
  onUserSelect: (user: User | null) => void;
  selectedUser?: User | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  autoOpenOnFocus?: boolean;
  clearSearchOnSelect?: boolean;
  showNoResultsMessage?: boolean;
  className?: string;
  placeholder?: string;
}

export function TeamMemberSelector({
  currentUser,
  users,
  onUserSelect,
  selectedUser,
  searchValue,
  onSearchChange,
  autoOpenOnFocus = false,
  clearSearchOnSelect = true,
  showNoResultsMessage = true,
  className = "",
  placeholder = "Search team members..."
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState("");
  
  // Use either the external search value or the internal one
  const searchTerm = searchValue !== undefined ? searchValue : internalSearchValue;

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  
  // Filter team members based on search term
  const filteredTeamMembers = safeUsers.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user.login || '').toLowerCase().includes(search) ||
      (user.name || '').toLowerCase().includes(search) ||
      (user.username || '').toLowerCase().includes(search) ||
      (user.type || '').toLowerCase().includes(search)
    );
  });

  // Handle search input change
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
    
    // Auto-open the dropdown when typing
    if (value.length > 0 && !open) {
      setOpen(true);
    }
  };

  // Handle selection of a team member
  const handleSelect = (user: User) => {
    onUserSelect(user);
    
    if (clearSearchOnSelect) {
      if (onSearchChange) {
        onSearchChange('');
      } else {
        setInternalSearchValue('');
      }
    }
    
    setOpen(false);
  };

  // Clear search input and selection
  const clearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    } else {
      setInternalSearchValue('');
    }
    setOpen(false);
  };

  // Clear selection (set to null)
  const clearSelection = () => {
    onUserSelect(null);
    clearSearch();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        {selectedUser ? (
          <div className="flex items-center justify-between border border-input px-3 py-2 rounded-md">
            <div className="pl-6">
              {selectedUser.login || selectedUser.username} 
              {selectedUser.name ? ` - ${selectedUser.name}` : ''}
              {selectedUser.type ? ` (${selectedUser.type})` : ''}
            </div>
            <button
              onClick={clearSelection}
              type="button"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => autoOpenOnFocus && setOpen(true)}
            className="pl-8 pr-8"
          />
        )}
        {!selectedUser && searchTerm && (
          <button 
            className="absolute right-2 top-2.5"
            onClick={clearSearch}
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      {open && !selectedUser && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-input rounded-md shadow-lg">
          {filteredTeamMembers.length > 0 ? (
            <ul className="py-1 max-h-60 overflow-auto">
              {filteredTeamMembers.map((user) => (
                <li 
                  key={user.id}
                  className={cn(
                    "px-3 py-2 flex items-center hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    selectedUser?.id === user.id && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(user)}
                >
                  <span className="flex-1">
                    {user.login || user.username} 
                    {user.name ? ` - ${user.name}` : ''}
                    {user.type ? ` (${user.type})` : ''}
                  </span>
                  {user.id === currentUser.id && (
                    <span className="text-xs text-muted-foreground ml-2">(myself)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            showNoResultsMessage && (
              <div className="p-3 text-sm text-muted-foreground">
                No team members match your search criteria
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
